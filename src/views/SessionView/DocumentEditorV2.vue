<script setup lang="ts">
import { computed, markRaw, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import { QuillBinding } from 'y-quill'
import { applyUpdate, Doc } from 'yjs'
import { socket } from '@/socket'
import { toastController } from '@ionic/vue'
import { closeCircleOutline } from 'ionicons/icons'
import LoadingMessage from '@/components/LoadingMessage.vue'
import FileDialog from '@/components/FileDialog.vue'
import ModerationService from '@/services/ModerationService'
import AnalyticsService from '@/services/AnalyticsService'
import SessionService from '@/services/SessionService'
import { EVENTS } from '@/consts'
import { file2b64 } from '@/utils/fileToBase64'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import LoggerService from '@/services/LoggerService'
import ActivityDot from '@/components/ActivityDot.vue'
import WordCount from '@/components/WordCount.vue'
import {
  processImage,
  getImageTooLargeMessage,
  isAllowedImageMime,
} from '@/utils/image-pipeline'
import { BYTES_PER_MEGABYTE } from '@/utils/bytes'
import { ImageDropPaste } from '@/quill/modules/image'
import { secondsInMs } from '@/utils/time-utils'
import {
  IMAGE_UPLOAD_EVENTS,
  getPartnerUploadingMsg,
  IMAGE_UPLOADING_STATE_MESSAGES,
  getPartnerUploadFailedMsg,
  PARTNER_IMAGE_UPLOAD_STATUS,
} from '@/composables/imageUploadState'
import ScreenShareToolbarButton from '@/components/ScreenShareToolbarButton.vue'
import type { Uuid } from '@/types/shared'

Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/image', ImageDropPaste)

const encode = (array: Uint8Array): string => array.toString()
const decode = (str: string): Uint8Array =>
  Uint8Array.from(str.split(',').map(Number))
const DEFAULT_IMAGE_QUALITY = 0.8

type Range = {
  index: number
  length: number
} | null

type FileSelectedEvent = {
  files: File[]
  fileSelectionEvent: Event & {
    target: HTMLInputElement
  }
}

type QuillToolbarModule = {
  addHandler: (name: string, handler: () => void | Promise<void>) => void
}

const props = withDefaults(
  defineProps<{
    sessionId?: string
    isAiWidgetEnabled?: boolean
    onWidgetClicked?: () => void
    showHasAiMessageIndicator?: boolean
    hasLiveMediaMeetingEnded: boolean
    isScreenSharing?: boolean
    isViewingPartnerScreenShare?: boolean
    isLoadingScreenShareControl?: boolean
    unableToJoinMediaRoom?: boolean
  }>(),
  {
    isAiWidgetEnabled: false,
    onWidgetClicked: undefined,
    showHasAiMessageIndicator: false,
    isScreenSharing: false,
    isViewingPartnerScreenShare: false,
    isLoadingScreenShareControl: false,
    unableToJoinMediaRoom: false,
  }
)

const emit = defineEmits<{
  (event: 'clickedShareScreen'): void
}>()

const store = useStore()

const fileDialog = ref<InstanceType<typeof FileDialog> | null>(null)
const quillContainer = ref<HTMLDivElement | null>(null)
// Quill related variables must NOT be reactive, no `ref`s
// Vue's proxies break Quill/Yjs behavior (causes duplicate/corrupted typing)
let quillEditor: Quill | null = null
let doc: Doc | null = null
let binding: QuillBinding | null = null
// set default loading state
const loadingText = ref<string | null>('Loading the document editor')
// For determining word counts.
const text = ref('')
const selectedText = ref('')
const uploadingImageTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const currentSession = computed(() => store.state.user.session)
const isSessionConnectionAlive = computed(
  () => store.state.user.isSessionConnectionAlive
)
const isConnected = computed(() => store.state.socket.isConnected)
const isSessionEnded = computed(() => !!store.state.user.session?.endedAt)

const isStudent = computed<boolean>(() => store.getters['user/isStudent'])
const isBanned = computed(() => store.getters['user/banType'])
const userType = computed(() => store.getters['user/userType'])
const isUpdatedDocEditorImageStorageEnabled = computed<boolean>(
  () => store.getters['featureFlags/isUpdatedDocEditorImageStorageEnabled']
)
const partnerImageUploadError = computed(
  () => store.getters['socket/partnerImageUploadError']
)
const partnerImageUploadStatus = computed(
  () => store.getters['socket/partnerImageUploadStatus']
)
const isSocketReadyToRequestForDoc = computed<[boolean, Uuid | undefined]>(
  () => [isConnected.value, currentSession.value?.id]
)
const MAX_IMAGE_FILE_SIZE_BYTES = computed(() => BYTES_PER_MEGABYTE * 10)

function getCursorsModule() {
  return quillEditor?.getModule('cursors') as QuillCursors | undefined
}

function getToolbarModule() {
  return quillEditor?.getModule('toolbar') as QuillToolbarModule | undefined
}

function handleWidgetClicked() {
  if (props.onWidgetClicked) {
    props.onWidgetClicked()
    return
  }

  // Does this need to be updated?
  if (props.isAiWidgetEnabled) {
    LoggerService.noticeError(
      'No widget handler was passed to the document editor'
    )
  }
}

function clearUploadImageTimeout() {
  if (uploadingImageTimeout.value) {
    clearTimeout(uploadingImageTimeout.value)
    uploadingImageTimeout.value = null
  }
}

async function showErrorToast(message: string) {
  const toast = await toastController.create({
    message,
    color: 'dark',
    position: 'middle',
    animated: true,
    duration: 5000,
    swipeGesture: 'vertical',
    buttons: [
      {
        icon: closeCircleOutline,
        role: 'cancel',
      },
    ],
  })
  await toast.present()
}

function toggleScreenShare() {
  AnalyticsService.captureEvent(
    EVENTS.SCREENSHARE_USER_CLICKED_SCREENSHARE_BUTTON,
    {
      tool: 'document-editor',
      userType: userType.value,
    }
  )
  emit('clickedShareScreen')
}

function createBoundDoc() {
  if (!quillEditor) return

  // Delegate tracking the contents of the doc to Yjs instead of Quill.
  doc = new Doc()
  binding = new QuillBinding(doc.getText('quill'), quillEditor)
  /*
   * We should read from and make text changes to `this.doc` rather than the Quill editor directly.
   * Yjs uses CRDTs internally to store and transmit changes, which are then used to resolve
   * conflicts between collaborators. This is how we ensure that the document editor stays
   * in sync for both partners during a session.
   */
  doc.on('update', quillTextChange)
}

function destroyBoundDoc() {
  if (doc) {
    doc.off('update', quillTextChange)
    doc.destroy()
    doc = null
  }

  binding?.destroy()
  binding = null
}

function quillTextChange(update: Uint8Array, origin: unknown, currentDoc: Doc) {
  // Only emit changes that are made in this component
  if ((origin as { doc?: Doc } | undefined)?.doc === currentDoc) {
    socket.emit('transmitQuillDeltaV2', {
      sessionId: currentSession.value?.id,
      update: encode(update),
    })
  }
  text.value = quillEditor?.getText() ?? ''
}

function quillSelectionChange(range: Range, oldRange: Range, source: string) {
  if (!quillEditor) return

  if (source === 'user') {
    socket.emit('transmitQuillSelection', {
      sessionId: currentSession.value?.id,
      range,
    })
  }

  selectedText.value = range
    ? quillEditor.getText(range.index, range.length)
    : ''
}

function requestQuillDoc() {
  socket.emit('requestQuillStateV2', {
    sessionId: currentSession.value?.id,
  })
}

async function onFileSelected(evt: FileSelectedEvent) {
  const file = evt.files[0]
  if (!file) return
  await processAndInsertImage(file)
  evt.fileSelectionEvent.target.value = ''
}

function onFileTooLarge() {
  const imageTooLargeMessage = getImageTooLargeMessage(
    MAX_IMAGE_FILE_SIZE_BYTES.value
  )
  showErrorToast(imageTooLargeMessage)
}

function onWrongFileType() {
  showErrorToast(`That file type isn't supported. Please upload an image.`)
}

function onImageFailedModeration(
  failures: unknown,
  isPartnerFailure?: boolean
) {
  AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_IMAGE_CENSORED, {
    tool: 'document-editor-v2',
  })

  store.commit('liveMedia/setModerationInfraction', {
    // @TODO This is mixing liveMedia with non-live media concerns, ugh...
    infraction: failures,
    isBanned: false,
    source: isPartnerFailure
      ? isStudent.value
        ? 'session_partner_coach_image_upload'
        : 'session_partner_student_image_upload'
      : 'image_upload',
    occurredAt: new Date(),
  })
}

async function processAndInsertImage(file: File) {
  if (!isAllowedImageMime(file.type)) return onWrongFileType()
  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES.value) return onFileTooLarge()

  loadingText.value =
    IMAGE_UPLOADING_STATE_MESSAGES.SENDER[IMAGE_UPLOAD_EVENTS.MODERATING_IMAGE]

  socket.emit(IMAGE_UPLOAD_EVENTS.MODERATING_IMAGE, {
    sessionId: currentSession.value?.id,
  })

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
      socket.emit(IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_FAILED, {
        sessionId: currentSession.value?.id,
        moderationFailures: failures,
      })
      onImageFailedModeration(failures)
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

    socket.emit(IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_SUCCESS, {
      sessionId: currentSession.value?.id,
    })

    AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_USER_UPLOADED_IMAGE, {
      tool: 'document-editor-v2',
    })
  } catch {
    socket.emit(IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_FAILED, {
      sessionId: currentSession.value?.id,
      uploadError: true,
    })

    AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_FAILED, {
      tool: 'document-editor-v2',
    })

    showErrorToast(
      IMAGE_UPLOADING_STATE_MESSAGES.SENDER[
        IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_FAILED
      ]
    )
  } finally {
    loadingText.value = null
    clearUploadImageTimeout()
  }
}

function handleQuillState({ updates }: { updates: string[] }) {
  if (!doc || !quillEditor) return

  for (const update of updates) {
    applyUpdate(doc, decode(update))
  }

  if (!uploadingImageTimeout.value) loadingText.value = null
  if (!isSessionEnded.value) quillEditor.enable()

  getCursorsModule()?.createCursor('partnerCursor', 'Partner', '#16D2AA')
}

function handlePartnerQuillDeltaV2({ update }: { update: string }) {
  if (!doc) return
  applyUpdate(doc, decode(update))
}

function handleQuillPartnerSelection({ range }: { range: Range }) {
  if (!quillEditor || !range) return
  getCursorsModule()?.moveCursor('partnerCursor', range)
}

onMounted(() => {
  const container = quillContainer.value
  if (!container) return

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
        },
      },
    })
  )

  getToolbarModule()?.addHandler('image', async () => {
    AnalyticsService.captureEvent(
      EVENTS.IMAGE_UPLOAD_USER_CLICKED_UPLOAD_IMAGE,
      {
        tool: 'document-editor-v2',
      }
    )
    fileDialog.value?.openFileDialog()
  })

  createBoundDoc()

  // do not allow user to make edits until the quill doc contents are set
  quillEditor.disable()

  quillEditor.on('selection-change', quillSelectionChange)

  socket.on('quillStateV2', handleQuillState)
  socket.on('partnerQuillDeltaV2', handlePartnerQuillDeltaV2)
  socket.on('quillPartnerSelection', handleQuillPartnerSelection)

  if (isConnected.value && currentSession.value?.id) requestQuillDoc()
})

onBeforeUnmount(() => {
  store.dispatch('socket/resetPartnerImageUploadStatus')

  if (quillEditor) quillEditor.off('selection-change', quillSelectionChange)

  destroyBoundDoc()

  socket.off('quillStateV2', handleQuillState)
  socket.off('partnerQuillDeltaV2', handlePartnerQuillDeltaV2)
  socket.off('quillPartnerSelection', handleQuillPartnerSelection)

  clearUploadImageTimeout()
})

watch(partnerImageUploadStatus, (newValue, oldValue) => {
  if (newValue !== oldValue) {
    clearUploadImageTimeout()

    switch (newValue) {
      case PARTNER_IMAGE_UPLOAD_STATUS.PARTNER_UPLOADING:
        loadingText.value = getPartnerUploadingMsg(isStudent.value)
        uploadingImageTimeout.value = setTimeout(() => {
          if (loadingText.value && uploadingImageTimeout.value) {
            uploadingImageTimeout.value = null
            showErrorToast(getPartnerUploadFailedMsg(isStudent.value))
            loadingText.value = null
            store.dispatch('socket/resetPartnerImageUploadStatus')
          }
        }, secondsInMs(10))
        break
      case PARTNER_IMAGE_UPLOAD_STATUS.GENERAL_ERROR:
        showErrorToast(getPartnerUploadFailedMsg(isStudent.value))
        loadingText.value = null
        break
      case PARTNER_IMAGE_UPLOAD_STATUS.MODERATION_FAILURE:
        onImageFailedModeration(partnerImageUploadError.value, true)
        loadingText.value = null
        break
      case PARTNER_IMAGE_UPLOAD_STATUS.SUCCESS:
        loadingText.value = null
        break
    }
  }
})

watch(isSessionConnectionAlive, (newValue, oldValue) => {
  const isReconnected = !oldValue && newValue
  if (isReconnected && !isSessionEnded.value) {
    // socket.io just reconnected and the session isn't over, allow edits to the document editor
    quillEditor?.enable()
    loadingText.value = null
  } else {
    clearUploadImageTimeout()
    quillEditor?.disable()
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
  <div class="document-editor" data-document-editor-version="2">
    <div id="ql-toolbar">
      <select class="ql-size" autocomplete="off"></select>
      <button type="button" class="ql-bold" />
      <button type="button" class="ql-italic" />
      <button type="button" class="ql-underline" />
      <button type="button" class="ql-strike" />
      <button type="button" class="ql-image" />
      <select class="ql-color" autocomplete="off"></select>
      <select class="ql-background" autocomplete="off"></select>
      <button type="button" class="ql-list" value="ordered" />
      <button type="button" class="ql-list" value="bullet" />
      <button
        v-if="isAiWidgetEnabled"
        type="button"
        @click="handleWidgetClicked"
      >
        <ChatBotIcon class="chat-bot-icon" />
        <ActivityDot v-if="showHasAiMessageIndicator" class="activity-dot" />
      </button>

      <div class="ql-ss">
        <ScreenShareToolbarButton
          :hasMeetingEnded="hasLiveMediaMeetingEnded"
          :isViewingPartnerScreenShare="isViewingPartnerScreenShare"
          :isScreenSharing="isScreenSharing"
          :onClick="toggleScreenShare"
          tooltipPosition="bottom"
          :isError="unableToJoinMediaRoom"
          :isLoading="isLoadingScreenShareControl"
          :spinnerSizing="{ height: 15, width: 15 }"
          :isLiveMediaBanned="isBanned"
        />
      </div>

      <WordCount
        class="ql-word-count"
        :text="text"
        :selected-text="selectedText"
      />
    </div>

    <div ref="quillContainer"></div>
    <transition name="document-loading">
      <LoadingMessage
        v-if="loadingText"
        :message="loadingText"
        class="document-loading document-loading--connection"
      />
    </transition>

    <FileDialog
      ref="fileDialog"
      accept="image/png, image/jpeg, image/webp, image/heic"
      :maxFileSizeBytes="MAX_IMAGE_FILE_SIZE_BYTES"
      :disabled="!!loadingText"
      @file-selected="onFileSelected"
      @file-too-large="onFileTooLarge"
    />
  </div>
</template>

<style lang="scss">
.ql-editor {
  overflow: visible;
}
</style>

<style lang="scss" scoped>
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

  .ql-toolbar {
    display: flex;
    flex-direction: row;
    gap: 4px;
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

  .ql-ss {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-self: center;
    padding-left: 3px;
  }

  .ql-word-count {
    margin-left: auto;
    font-size: 14px;
  }
}

.chat-bot-icon {
  flex-shrink: 0;
  height: 20px;
  width: 20px;
}

.activity-dot {
  position: relative;
  bottom: 10px;
  left: 10px;
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

.ql-picker-label svg {
  pointer-events: none;
}
</style>
