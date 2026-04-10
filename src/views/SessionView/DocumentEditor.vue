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
      <word-count class="ql-word-count" :text="text" selected-text="" />
    </div>
    <div id="quill-container"></div>
    <transition name="document-loading">
      <loading-message
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
    <refresh-document-editor-modal v-if="showRefreshModal" />
    <FileDialog
      accept="image/png, image/jpeg, image/webp, image/heic"
      ref="fileDialog"
      @file-selected="onFileSelected"
      @file-too-large="onFileTooLarge"
      :maxFileSizeBytes="MAX_IMAGE_FILE_SIZE_BYTES"
    />
  </div>
</template>

<script>
import { markRaw } from 'vue'
import { mapState, mapGetters } from 'vuex'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
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

Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/image', ImageDropPaste)
const DEFAULT_IMAGE_QUALITY = 0.8

/*
 * NOTE: this component supports midtown's version of the Quill editor.
 *       When a student creates a session from the iOS app, we store
 *       it as a v1 version (we haven't yet prioritized upgrading Quill there)
 *       of the editor and force the volunteer high-line app to use this component
 *       so the quill document format matches
 */

export default {
  components: {
    FileDialog,
    LoadingMessage,
    RefreshDocumentEditorModal,
    WordCount,
  },
  props: {
    sessionId: {
      type: String,
      required: false,
    },
  },
  data() {
    return {
      quillEditor: null,
      // set default loading state
      isLoading: true,
      loadingText: 'Loading the document editor',
      incomingDeltas: [],
      retries: 0,
      showRefreshModal: false,
      error: '',
      text: '',
    }
  },
  computed: {
    ...mapState({
      currentSession: (state) => state.user.session,
      isSessionConnectionAlive: (state) => state.user.isSessionConnectionAlive,
      isConnected: (state) => state.socket.isConnected,
      isSessionEnded: (state) => !!state.user.session?.endedAt,
    }),
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isUpdatedDocEditorImageStorageEnabled:
        'featureFlags/isUpdatedDocEditorImageStorageEnabled',
    }),
    isSocketReadyToRequestForDoc() {
      return [this.isConnected, this.currentSession?.id]
    },
    MAX_IMAGE_FILE_SIZE_BYTES() {
      return BYTES_PER_MEGABYTE * 10
    },
  },
  mounted() {
    const handlers = {}

    this.quillEditor = markRaw(
      new Quill('#quill-container', {
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
            processAndInsertImage: this.processAndInsertImage,
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

    this.quillEditor.getModule('toolbar').addHandler('image', async () => {
      this.$refs.fileDialog.openFileDialog()
    })

    // do not allow user to make edits until the quill doc contents are set
    this.quillEditor.disable()

    this.quillEditor.on('text-change', this.quillTextChange)
    this.quillEditor.on('selection-change', this.quillSelectionChange)

    /*
     * This seems like an anti-pattern.
     * Any events sent before `created()` is called will be missed.
     * Socket listeners should ideally be defined in the socket store.
     */
    socket.on('quillState', ({ delta }) => {
      this.quillEditor.setContents(delta)
      this.emptyIncomingDeltas()
      this.isLoading = false
      this.loadingText = ''

      if (!this.isSessionEnded) {
        this.quillEditor.enable()
      }

      this.quillEditor
        .getModule('cursors')
        .createCursor('partnerCursor', 'Partner', '#16D2AA')
    })

    socket.on('partnerQuillDelta', ({ delta }) => {
      if (this.isLoading) this.incomingDeltas.push(delta)
      else this.updateContents(delta)
    })

    socket.on('quillPartnerSelection', ({ range }) => {
      this.quillEditor.getModule('cursors').moveCursor('partnerCursor', range)
    })
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
    socket.on('lastDeltaStored', ({ delta }) => {
      if (delta) {
        const queueCutoff = this.incomingDeltas.findIndex(
          (pendingDelta) => pendingDelta.id === delta.id
        )
        this.incomingDeltas = this.incomingDeltas.slice(queueCutoff + 1)
      }
    })

    socket.on('retryLoadingDoc', () => {
      const maxRetries = 10
      if (this.retries > maxRetries) {
        this.showRefreshModal = true
      } else {
        this.retries++
        socket.emit('requestQuillState', {
          sessionId: this.currentSession._id,
        })
      }
    })

    if (this.isConnected && this.currentSession?.id) this.requestQuillDoc()
  },
  methods: {
    quillTextChange(delta, oldDelta, source) {
      if (source === 'user') {
        socket.emit('transmitQuillDelta', {
          sessionId: this.currentSession._id,
          delta,
        })
      }
      this.text = this.quillEditor.getText()
    },

    quillSelectionChange(range, oldRange, source) {
      if (source === 'user') {
        socket.emit('transmitQuillSelection', {
          sessionId: this.currentSession._id,
          range,
        })
      }
    },
    updateContents(delta) {
      this.quillEditor.updateContents(delta)
    },
    emptyIncomingDeltas() {
      for (const delta of this.incomingDeltas) {
        this.updateContents(delta)
      }
    },
    requestQuillDoc() {
      if (!this.currentSession?.endedAt) {
        socket.emit('requestQuillState', {
          sessionId: this.currentSession.id,
        })
      }
    },
    async onFileSelected(evt) {
      const { files } = evt.fileSelectionEvent.target
      const file = files[0]
      await this.processAndInsertImage(file)
    },
    async processAndInsertImage(file) {
      if (!isAllowedImageMime(file.type)) return this.onWrongFileType()
      if (file.size > this.MAX_IMAGE_FILE_SIZE_BYTES)
        return this.onFileTooLarge()

      this.isLoading = true
      this.loadingText = 'Loading image'

      try {
        file = await processImage(file, {
          quality: DEFAULT_IMAGE_QUALITY,
        })
        const formData = new FormData()
        formData.append('image', file)
        formData.append('sessionId', this.sessionId)

        const { isClean, failures } =
          await ModerationService.checkIfImageIsClean(formData)
        if (!isClean) {
          this.onImageUploadModerationFailure(failures)
          return
        }

        if (this.isUpdatedDocEditorImageStorageEnabled) {
          const imageUrl = await SessionService.uploadSessionImage(
            this.sessionId,
            file
          )
          const range = this.quillEditor.getSelection()
          this.quillEditor.insertEmbed(range.index, 'image', imageUrl, 'user')
        } else {
          const range = this.quillEditor.getSelection()
          const b64 = await file2b64(file)
          this.quillEditor.insertEmbed(range.index, 'image', b64, 'user')
        }
      } catch {
        void ModalService.showAlert(
          'Image Error',
          'There was an issue analyzing the image. Please try a different image, or reach out to support@upchieve.org for assistance.'
        )
      } finally {
        this.isLoading = false
        this.loadingText = ''
      }
    },
    onFileTooLarge() {
      const imageTooLargeMessage = getImageTooLargeMessage(
        this.MAX_IMAGE_FILE_SIZE_BYTES
      )
      this.setTemporaryErrorMessage(imageTooLargeMessage)
    },
    onWrongFileType() {
      this.setTemporaryErrorMessage(
        `That file type isn't supported. Please upload an image.`
      )
    },
    setTemporaryErrorMessage(message, timeout = 2000) {
      this.error = message
      setTimeout(() => (this.error = ''), timeout)
    },
    onImageUploadModerationFailure(event) {
      this.$store.commit('liveMedia/setModerationInfraction', {
        infraction: event.failures,
        isBanned: false,
        source: 'image_upload',
        occurredAt: new Date(),
      })
    },
  },
  watch: {
    isSessionConnectionAlive(newValue, oldValue) {
      const isReconnected = !oldValue && newValue
      if (isReconnected && !this.isSessionEnded) {
        // socket.io just reconnected and the session isn't over, allow edits to the document editor
        this.quillEditor.enable()
        this.isLoading = false
        this.loadingText = ''
      } else {
        this.quillEditor.disable()
        this.isLoading = true
        this.loadingText = 'Attempting to connect the document editor'
      }
    },
    isSessionEnded(newValue, oldValue) {
      if (newValue || oldValue) {
        this.quillEditor.disable()
      }
    },
    isSocketReadyToRequestForDoc(currentVal) {
      const [isConnected, sessionId] = currentVal
      if (isConnected && sessionId) this.requestQuillDoc()
    },
  },
}
</script>

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
