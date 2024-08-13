<template>
  <div class="document-editor">
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
  volunteerAttemptedToAddImage,
} from '@/utils/quill-image-optimizer'
import FileDialog from '@/components/FileDialog.vue'
import ModerationService from '@/services/ModerationService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { file2b64 } from '@/utils/fileToBase64'

Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/image', ImageCompressor)

export default {
  components: {
    FileDialog,
    LoadingMessage,
    RefreshDocumentEditorModal,
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
      inappropriateImageErrorMessage:
        'The image is not appropriate. If you believe this to be an error, please contact us at support@upchieve.org.',
      failedToModerateImageMessage:
        'There was an issue analyzing the image. Please try a different image, or reach out to support@upchieve.org for assistance.',
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
      isVolunteerImageUploadEnabled:
        'featureFlags/isVolunteerImageUploadEnabled',
    }),
    isSocketReadyToRequestForDoc() {
      return [this.isConnected, this.currentSession?.id]
    },
    volunteerImageAlertMessage() {
      return this.isVolunteerImageUploadEnabled
        ? 'Please upload images through the image button on the toolbar.'
        : 'At this time, coaches cannot upload images for student safety reasons. Please direct the student to an online resource instead.'
    },
  },
  mounted() {
    if (this.isVolunteerImageUploadEnabled)
      AnalyticsService.captureEvent(EVENTS.VOLUNTEER_IMAGE_UPLOAD_SEEN, {
        sessionType: 'DocumentEditor',
      })
    const toolbar = [
      [{ header: [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
    ]

    // To increase exposure, put this near the more frequently used tools
    if (
      this.isStudent ||
      (this.isVolunteer && this.isVolunteerImageUploadEnabled)
    )
      toolbar.push(['image'])

    toolbar.push([
      { color: [] },
      { background: [] },
      { list: 'ordered' },
      { list: 'bullet' },
    ])

    this.quillEditor = markRaw(
      new Quill('#quill-container', {
        placeholder: 'Type or paste something...',
        theme: 'snow',
        formats: [
          'header',
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
            isVolunteer: this.isVolunteer,
          },
          cursors: {
            selectionChangeSource: 'cursor-api',
            transformOnTextChange: true,
          },
          toolbar,
        },
      })
    )

    const imageHandler = async () => {
      AnalyticsService.captureEvent(EVENTS.VOLUNTEER_CLICKED_UPLOAD_IMAGE, {
        sessionType: 'DocumentEditor',
      })
      this.$refs.fileDialog.openFileDialog()
    }

    if (this.isVolunteer && this.isVolunteerImageUploadEnabled) {
      this.quillEditor.getModule('toolbar').addHandler('image', imageHandler)
    }

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
      volunteerAttemptedToAddImage,
      () => alert(this.volunteerImageAlertMessage),
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
        const { isClean } =
          await ModerationService.checkIfImageIsClean(formData)
        if (!isClean) {
          AnalyticsService.captureEvent(EVENTS.VOLUNTEER_IMAGE_CENSORED, {
            sessionType: 'DocumentEditor',
          })
          this.showImageUploadError(this.inappropriateImageErrorMessage)
          return
        }
      } catch (err) {
        AnalyticsService.captureEvent(
          EVENTS.VOLUNTEER_IMAGE_MODERATION_FAILED,
          {
            sessionType: 'DocumentEditor',
          }
        )
        this.showImageUploadError(this.failedToModerateImageMessage)
      }

      const range = this.quillEditor.getSelection()
      const b64 = await file2b64(file)
      this.quillEditor.insertEmbed(range.index, 'image', b64, 'user')
      AnalyticsService.captureEvent(EVENTS.VOLUNTEER_UPLOADED_IMAGE, {
        sessionType: 'DocumentEditor',
      })
    },
    showImageUploadError(message) {
      alert(message)
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
.document-editor {
  height: 100%;
  text-align: left;
  display: flex;
  flex-direction: column;
  position: relative;

  .ql-container.ql-snow {
    overflow: scroll;
    border: none;
  }

  .ql-toolbar.ql-snow {
    border-width: 0 0 1px 0;
    border-color: $c-border-grey;
  }

  .ql-cursor-flag {
    display: none;
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
</style>
