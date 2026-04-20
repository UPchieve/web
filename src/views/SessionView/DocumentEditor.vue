<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import type Delta from 'quill-delta'
import { socket } from '@/socket'
import LoadingMessage from '@/components/LoadingMessage.vue'
import RefreshDocumentEditorModal from '@/views/SessionView/RefreshDocumentEditorModal.vue'
import FileDialog from '@/components/FileDialog.vue'
import ModerationService from '@/services/ModerationService'
import { file2b64 } from '@/utils/fileToBase64'
import SessionService from '@/services/SessionService'
import ModalService from '@/services/ModalService'
import WordCount from '@/components/WordCount.vue'
import {
  processImage,
  getImageTooLargeMessage,
  isAllowedImageMime,
} from '@/utils/image-pipeline'
import { BYTES_PER_MEGABYTE } from '@/utils/bytes'
import { ImageDropPaste } from '@/quill/modules/image'
import type { Uuid } from '@/types/shared'

/*
 * NOTE: this component supports midtown's version of the Quill editor.
 *       When a student creates a session from the iOS app, we store
 *       it as a v1 version (we haven't yet prioritized upgrading Quill there)
 *       of the editor and force the volunteer high-line app to use this component
 *       so the quill document format matches
 */

Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/image', ImageDropPaste)
const DEFAULT_IMAGE_QUALITY = 0.8

type Range = {
  index: number
  length: number
} | null

type QuillToolbarModule = {
  addHandler: (name: string, handler: () => void | Promise<void>) => void
}

type PendingDelta = Delta & {
  id?: string
}

type QuillStatePayload = {
  delta: Delta
}

type PartnerDeltaPayload = {
  delta: PendingDelta
}

type PartnerSelectionPayload = {
  range: Range
}

type LastDeltaStoredPayload = {
  delta?: {
    id?: string
  }
}

type FileSelectedEvent = {
  fileSelectionEvent: Event & {
    target: HTMLInputElement & {
      files: FileList | null
    }
  }
}

const props = defineProps<{
  sessionId?: string
}>()

const store = useStore()

const fileDialog = ref<InstanceType<typeof FileDialog> | null>(null)
const quillContainer = ref<HTMLDivElement | null>(null)

// Quill editor must NOT be reactive
// Vue's proxies break Quill behavior (causes duplicate/corrupted typing)
let quillEditor: Quill | null = null

const isLoading = ref(true)
const loadingText = ref('Loading the document editor')
const incomingDeltas = ref<PendingDelta[]>([])
const retries = ref(0)
const showRefreshModal = ref(false)
const error = ref('')
const text = ref('')

const currentSession = computed(() => store.state.user.session)
const isSessionConnectionAlive = computed(
  () => store.state.user.isSessionConnectionAlive
)
const isConnected = computed(() => store.state.socket.isConnected)
const isSessionEnded = computed(() => !!store.state.user.session?.endedAt)
const isUpdatedDocEditorImageStorageEnabled = computed<boolean>(
  () => store.getters['featureFlags/isUpdatedDocEditorImageStorageEnabled']
)
const isSocketReadyToRequestForDoc = computed<[boolean, Uuid | undefined]>(
  () => [isConnected.value, currentSession.value?.id]
)
const MAX_IMAGE_FILE_SIZE_BYTES = computed(() => BYTES_PER_MEGABYTE * 10)

function getToolbarModule() {
  return quillEditor?.getModule('toolbar') as QuillToolbarModule | undefined
}

function getCursorsModule() {
  return quillEditor?.getModule('cursors') as QuillCursors | undefined
}

function quillTextChange(delta: Delta, oldDelta: Delta, source: string) {
  if (!quillEditor) return

  if (source === 'user') {
    socket.emit('transmitQuillDelta', {
      sessionId: currentSession.value?.id,
      delta,
    })
  }

  text.value = quillEditor.getText()
}

function quillSelectionChange(range: Range, oldRange: Range, source: string) {
  if (source === 'user') {
    socket.emit('transmitQuillSelection', {
      sessionId: currentSession.value?.id,
      range,
    })
  }
}

function updateContents(delta: PendingDelta) {
  quillEditor?.updateContents(delta)
}

function emptyIncomingDeltas() {
  for (const delta of incomingDeltas.value) {
    updateContents(delta)
  }
}

function requestQuillDoc() {
  if (!currentSession.value?.endedAt) {
    socket.emit('requestQuillState', {
      sessionId: currentSession.value?.id,
    })
  }
}

async function onFileSelected(evt: FileSelectedEvent) {
  const files = evt.fileSelectionEvent.target.files
  const file = files?.[0]
  if (!file) return
  await processAndInsertImage(file)
  evt.fileSelectionEvent.target.value = ''
}

async function processAndInsertImage(file: File) {
  if (!isAllowedImageMime(file.type)) return onWrongFileType()
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES.value) return onFileTooLarge()

  isLoading.value = true
  loadingText.value = 'Loading image'

  try {
    file = await processImage(file, {
      quality: DEFAULT_IMAGE_QUALITY,
    })
    const formData = new FormData()
    formData.append('image', file)
    if (props.sessionId) formData.append('sessionId', props.sessionId)

    const { isClean, failures } =
      await ModerationService.checkIfImageIsClean(formData)
    if (!isClean) {
      onImageUploadModerationFailure(failures)
      return
    }

    if (!quillEditor) return

    if (isUpdatedDocEditorImageStorageEnabled.value) {
      const imageUrl = await SessionService.uploadSessionImage(
        props.sessionId!,
        file
      )
      const range = quillEditor.getSelection()
      quillEditor.insertEmbed(range?.index ?? 0, 'image', imageUrl, 'user')
    } else {
      const range = quillEditor.getSelection()
      const b64 = await file2b64(file)
      quillEditor.insertEmbed(range?.index ?? 0, 'image', b64, 'user')
    }
  } catch {
    await ModalService.showAlert(
      'Image Error',
      'There was an issue analyzing the image. Please try a different image, or reach out to support@upchieve.org for assistance.'
    )
  } finally {
    isLoading.value = false
    loadingText.value = ''
  }
}

function onFileTooLarge() {
  const imageTooLargeMessage = getImageTooLargeMessage(
    MAX_IMAGE_FILE_SIZE_BYTES.value
  )
  setTemporaryErrorMessage(imageTooLargeMessage)
}

function onWrongFileType() {
  setTemporaryErrorMessage(
    `That file type isn't supported. Please upload an image.`
  )
}

function setTemporaryErrorMessage(message: string, timeout = 2000) {
  error.value = message
  setTimeout(() => {
    error.value = ''
  }, timeout)
}

function onImageUploadModerationFailure(failures: unknown) {
  store.commit('liveMedia/setModerationInfraction', {
    infraction: failures,
    isBanned: false,
    source: 'image_upload',
    occurredAt: new Date(),
  })
}

function handleQuillState({ delta }: QuillStatePayload) {
  if (!quillEditor) return

  quillEditor.setContents(delta)
  emptyIncomingDeltas()
  isLoading.value = false
  loadingText.value = ''

  if (!isSessionEnded.value) {
    quillEditor.enable()
  }

  getCursorsModule()?.createCursor('partnerCursor', 'Partner', '#16D2AA')
}

function handlePartnerQuillDelta({ delta }: PartnerDeltaPayload) {
  if (isLoading.value) incomingDeltas.value.push(delta)
  else updateContents(delta)
}

function handleQuillPartnerSelection({ range }: PartnerSelectionPayload) {
  if (!range) return
  getCursorsModule()?.moveCursor('partnerCursor', range)
}

function handleLastDeltaStored({ delta }: LastDeltaStoredPayload) {
  if (!delta?.id) return

  const queueCutoff = incomingDeltas.value.findIndex(
    (pendingDelta) => pendingDelta.id === delta.id
  )
  incomingDeltas.value = incomingDeltas.value.slice(queueCutoff + 1)
}

function handleRetryLoadingDoc() {
  const maxRetries = 10
  if (retries.value > maxRetries) {
    showRefreshModal.value = true
  } else {
    retries.value++
    socket.emit('requestQuillState', {
      sessionId: currentSession.value?.id,
    })
  }
}

onMounted(() => {
  const container = quillContainer.value
  if (!container) return

  const handlers = {}

  quillEditor = markRaw(
    new Quill(container, {
      placeholder: 'Type or paste something...',
      theme: 'snow',
      formats: [
        'size',
        'bold',
        'italic',
        'underline',
        'strike',
        'color',
        'background',
        'list',
        'image',
      ],
      modules: {
        image: {
          processAndInsertImage,
          isAllowedImageMime,
        },
        cursors: {
          selectionChangeSource: 'cursor-api',
          transformOnTextChange: true,
        },
        toolbar: {
          container: '#ql-toolbar',
          handlers,
        },
      },
    })
  )

  getToolbarModule()?.addHandler('image', async () => {
    fileDialog.value?.openFileDialog()
  })

  // do not allow user to make edits until the quill doc contents are set
  quillEditor.disable()

  quillEditor.on('text-change', quillTextChange)
  quillEditor.on('selection-change', quillSelectionChange)

  /*
   * This seems like an anti-pattern.
   * Any events sent before `created()` is called will be missed.
   * Socket listeners should ideally be defined in the socket store.
   */
  socket.on('quillState', handleQuillState)
  socket.on('partnerQuillDelta', handlePartnerQuillDelta)
  socket.on('quillPartnerSelection', handleQuillPartnerSelection)
  socket.on('lastDeltaStored', handleLastDeltaStored)
  socket.on('retryLoadingDoc', handleRetryLoadingDoc)

  if (isConnected.value && currentSession.value?.id) {
    requestQuillDoc()
  }
})

onBeforeUnmount(() => {
  if (quillEditor) {
    quillEditor.off('text-change', quillTextChange)
    quillEditor.off('selection-change', quillSelectionChange)
  }

  socket.off('quillState', handleQuillState)
  socket.off('partnerQuillDelta', handlePartnerQuillDelta)
  socket.off('quillPartnerSelection', handleQuillPartnerSelection)
  /**
   *
   * This event lets us know the last delta that was composed to the Quill
   * document in our server cache
   *
   * If the last delta stored is found in our `incomingDeltas` queue,
   * that means the requested quill state from our server contains
   * the last delta stored and the ones before it. Remove those from
   * `incomingDeltas` to avoid appending duplicate deltas to the client Quill doc
   *
   */
  socket.off('lastDeltaStored', handleLastDeltaStored)
  socket.off('retryLoadingDoc', handleRetryLoadingDoc)

  quillEditor = null
})

watch(isSessionConnectionAlive, (newValue, oldValue) => {
  const isReconnected = !oldValue && newValue
  if (isReconnected && !isSessionEnded.value) {
    // socket.io just reconnected and the session isn't over, allow edits to the document editor
    quillEditor?.enable()
    isLoading.value = false
    loadingText.value = ''
  } else {
    quillEditor?.disable()
    isLoading.value = true
    loadingText.value = 'Attempting to connect the document editor'
  }
})

watch(isSessionEnded, (newValue, oldValue) => {
  if (newValue || oldValue) {
    quillEditor?.disable()
  }
})

watch(isSocketReadyToRequestForDoc, ([connected, sessionId]) => {
  if (connected && sessionId) {
    requestQuillDoc()
  }
})
</script>

<template>
  <div class="document-editor">
    <div id="ql-toolbar">
      <select class="ql-size" autocomplete="off" />
      <button type="button" class="ql-bold" />
      <button type="button" class="ql-italic" />
      <button type="button" class="ql-underline" />
      <button type="button" class="ql-strike" />
      <button type="button" class="ql-image" />
      <select class="ql-color" autocomplete="off" />
      <select class="ql-background" autocomplete="off" />
      <button type="button" class="ql-list" value="ordered" />
      <button type="button" class="ql-list" value="bullet" />
      <WordCount class="ql-word-count" :text="text" selected-text="" />
    </div>

    <div ref="quillContainer"></div>

    <transition name="document-loading">
      <LoadingMessage
        v-if="isLoading"
        :message="loadingText"
        class="document-loading document-loading--connection"
      />
    </transition>

    <transition name="document-loading">
      <p v-if="error" class="document-loading document-loading--error">
        {{ error }}
      </p>
    </transition>

    <RefreshDocumentEditorModal v-if="showRefreshModal" />

    <FileDialog
      ref="fileDialog"
      accept="image/png, image/jpeg, image/webp, image/heic"
      :maxFileSizeBytes="MAX_IMAGE_FILE_SIZE_BYTES"
      @file-selected="onFileSelected"
      @file-too-large="onFileTooLarge"
    />
  </div>
</template>

<style lang="scss">
.ql-editor {
  overflow: visible;
}

.document-editor {
  height: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  position: relative;

  .ql-container.ql-snow {
    overflow: auto;
    border: none;
  }

  .ql-toolbar.ql-snow {
    border-width: 0 0 1px 0;
    border-color: $c-border-grey;
  }

  .ql-cursor-flag {
    display: none;
  }

  .ql-toolbar {
    display: flex;
  }

  .ql-word-count {
    margin-left: auto;
    font-size: 14px;
  }
}

.document-loading {
  width: 100%;
  background-color: $c-shadow-warn;
  color: #fff;
  font-weight: normal;
  min-height: 40px;
  // !important is used to override the position specified in the LoadingMessage component
  position: absolute !important;
  left: 0;
  top: 40px;
  padding: 12px;
  z-index: 1000;
  transition: all 0.15s ease-in;
  text-align: center;

  &--connection {
    background-color: rgba(110, 140, 171, 0.87);
  }

  &--error {
    background-color: $c-error-red;
  }
}

select svg {
  pointer-events: none;
}
</style>
