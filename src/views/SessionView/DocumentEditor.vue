<template>
  <div class="document-editor">
    <div id="ql-toolbar">
      <select class="ql-size" />
      <button class="ql-bold" />
      <button class="ql-italic" />
      <button class="ql-underline" />
      <button class="ql-strike" />
      <select class="ql-color" />
      <select class="ql-background" />
      <button class="ql-list" value="ordered" />
      <button class="ql-list" value="bullet" />
      <word-count class="ql-word-count" :text="text" selected-text="" />
    </div>
    <div id="quill-container"></div>
    <transition name="document-loading">
      <loading-message
        message="Loading the document editor"
        class="document-loading document-loading--connection"
        v-show="isLoading"
      />
    </transition>
    <transition name="document-loading">
      <loading-message
        message="Attempting to connect the document editor"
        class="document-loading document-loading--connection"
        v-show="isConnecting"
      />
    </transition>
    <refresh-document-editor-modal v-if="showRefreshModal" />
    <FileDialog
      accept="image/*, image/heic"
      ref="fileDialog"
      @file-selected="onFileSelected"
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
import {
  ImageCompressor,
  maxImagesEventName,
  fileSizeTooBigEventName,
  MAX_TOTAL_IMAGES,
  imageFailedModerationEventName,
} from '@/utils/quill-image-optimizer'
import FileDialog from '@/components/FileDialog.vue'
import ModerationService from '@/services/ModerationService'
import { file2b64 } from '@/utils/fileToBase64'
import WordCount from '@/components/WordCount.vue'

Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/image', ImageCompressor)

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
      incomingDeltas: [],
      retries: 0,
      showRefreshModal: false,
      isConnecting: false,
      text: '',
    }
  },
  computed: {
    ...mapState({
      currentSession: (state) => state.user.session,
      isSessionConnectionAlive: (state) => state.user.isSessionConnectionAlive,
      isConnected: (state) => state.socket.isConnected,
    }),
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      isSessionRecapDmsActive: 'featureFlags/isSessionRecapDmsActive',
    }),
    isSocketReadyToRequestForDoc() {
      return [this.isConnected, this.currentSession?.id]
    },
  },
  mounted() {
    let handlers = {}

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
            quality: 0.8,
            maxWidth: 1000,
            maxHeight: 1000,
            imageType: 'image/webp',
            sessionId: this.sessionId,
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

    this.quillEditor.root.addEventListener(
      maxImagesEventName,
      () =>
        alert(
          `Too many images uploaded. \n\n You can not have more than ${MAX_TOTAL_IMAGES} images in the document editor.`
        ),
      false
    )
    this.quillEditor.root.addEventListener(
      fileSizeTooBigEventName,
      () =>
        alert(
          `Image file size is too big. \n\n Please compress/resize the image before uploading.`
        ),
      false
    )
    this.quillEditor.root.addEventListener(
      imageFailedModerationEventName,
      (event) => this.onImageUploadModerationFailure(event),
      false
    )

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
      this.quillEditor.enable()

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
      socket.emit('requestQuillState', {
        sessionId: this.currentSession.id,
      })
    },
    async onFileSelected(evt) {
      const { files } = evt.fileSelectionEvent.target
      let file = files[0]
      const formData = new FormData()
      formData.append('image', file)
      formData.append('sessionId', this.sessionId)
      try {
        const { isClean, failures } =
          await ModerationService.checkIfImageIsClean(formData)
        if (!isClean) {
          this.onImageUploadModerationFailure(failures)
          return
        }
      } catch (err) {
        alert(
          'There was an issue analyzing the image. Please try a different image, or reach out to support@upchieve.org for assistance.'
        )
      }

      const range = this.quillEditor.getSelection()
      const b64 = await file2b64(file)
      this.quillEditor.insertEmbed(range.index, 'image', b64, 'user')
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
      if (
        (newValue && !oldValue) ||
        (this.isSessionRecapDmsActive && this.isVolunteer)
      ) {
        // socket.io just reconnected, allow edits to the document editor
        // or the volunteer is able to send DMs after the session ends
        this.quillEditor.enable()
        this.isConnecting = false
      } else {
        this.quillEditor.disable()
        this.isConnecting = true
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
}

select svg {
  pointer-events: none;
}
</style>
