<template>
  <div class="document-editor" data-document-editor-version="2">
    <div id="ql-toolbar">
      <select class="ql-size" />
      <button class="ql-bold" />
      <button class="ql-italic" />
      <button class="ql-underline" />
      <button class="ql-strike" />
      <button class="ql-image" />
      <select class="ql-color" />
      <select class="ql-background" />
      <button class="ql-list" value="ordered" />
      <button class="ql-list" value="bullet" />
      <button
        class="ql-aiWidget"
        v-if="isAiWidgetEnabled"
        @click="onWidgetClicked"
      >
        <ChatBotIcon class="chat-bot-icon" />
        <activity-dot v-if="showHasAiMessageIndicator" />
      </button>
      <div v-if="showScreenShareTool">
        <span
          v-if="unableToJoinCall"
          @mouseenter="toggleScreenShareErrorTooltipOpen"
          @mouseleave="toggleScreenShareErrorTooltipOpen"
          @click="toggleScreenShareErrorTooltipOpen"
          v-tooltip="{
            text: 'Could not load the Screen Share tool. Please refresh and try again.',
            position: 'right',
            color: 'black',
            open: showScreenShareErrorTooltip,
          }"
        >
          <ErrorIcon class="screenshare-error" />
        </span>
        <Spinner
          v-else-if="isJoiningCall"
          :height="20"
          :width="20"
          :container-height="20"
          :container-width="20"
        />

        <button
          v-else-if="isViewingPartnerScreenShare"
          @click="toggleScreenShare"
          v-tooltip="{
            text: `You can't share your screen while your partner is sharing.`,
            position: 'bottom',
            color: 'black',
          }"
        >
          <EyeIcon class="toolbar-item__svg eye-icon" />
        </button>

        <button v-else @click="toggleScreenShare">
          <StopScreenShareIcon v-if="isScreenSharing" />
          <ScreenShareIcon v-else />
        </button>
      </div>
      <word-count class="ql-word-count" :text="text" />
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
import { mapGetters, mapState } from 'vuex'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import { QuillBinding } from 'y-quill'
import { applyUpdate, Doc } from 'yjs'
import { socket } from '@/socket'
import LoadingMessage from '@/components/LoadingMessage.vue'
import RefreshDocumentEditorModal from '@/views/SessionView/RefreshDocumentEditorModal.vue'
import {
  fileSizeTooBigEventName,
  ImageCompressor,
  imageFailedModerationEventName,
  MAX_TOTAL_IMAGES,
  maxImagesEventName,
} from '@/utils/quill-image-optimizer'
import FileDialog from '@/components/FileDialog.vue'
import ModerationService from '@/services/ModerationService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { file2b64 } from '@/utils/fileToBase64'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import ScreenShareIcon from '@/assets/screen-share.svg'
import StopScreenShareIcon from '@/assets/stop-screen-share.svg'
import ErrorIcon from '@/assets/sidebar_icons/exclamation.svg'
import LoggerService from '@/services/LoggerService'
import ActivityDot from '@/components/ActivityDot.vue'
import Spinner from '@/components/Spinner.vue'
import { vTooltip } from 'maz-ui'
import WordCount from '@/components/WordCount.vue'
import EyeIcon from '@/assets/eye.svg'
Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/image', ImageCompressor)

const encode = (array) => array.toString()
const decode = (str) => Uint8Array.from(str.split(',').map(Number))

export default {
  directives: {
    tooltip: vTooltip,
  },
  components: {
    FileDialog,
    LoadingMessage,
    RefreshDocumentEditorModal,
    ChatBotIcon,
    ScreenShareIcon,
    StopScreenShareIcon,
    ErrorIcon,
    ActivityDot,
    Spinner,
    WordCount,
    EyeIcon,
  },
  props: {
    sessionId: {
      type: String,
      required: false,
    },
    isAiWidgetEnabled: {
      type: Boolean,
      default: false,
    },

    onWidgetClicked: {
      type: Function,
      required: false,
      default: () => {
        if (this.isAiWidgetEnabled)
          LoggerService.noticeError(
            'No widget handler was passed to the document editor'
          )
      },
    },
    showHasAiMessageIndicator: {
      type: Boolean,
      default: false,
    },
    isScreenShareEnabled: {
      type: Boolean,
      default: false,
    },
    isScreenSharing: {
      type: Boolean,
      default: false,
    },
    isViewingPartnerScreenShare: {
      type: Boolean,
      default: false,
    },
    isJoiningCall: {
      type: Boolean,
      default: false,
    },
    unableToJoinCall: {
      type: Boolean,
      default: false,
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
      showScreenShareErrorTooltip: false,
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
      userType: 'user/userType',
      isSessionRecapDmsActive: 'featureFlags/isSessionRecapDmsActive',
      sessionPartner: 'user/sessionPartner',
      mobileMode: 'app/mobileMode',
    }),
    showScreenShareTool() {
      // Show to students once a volunteer is sharing their screen
      // and show to volunteers right away
      return this.isScreenShareEnabled
    },
    isSocketReadyToRequestForDoc() {
      return [this.isConnected, this.currentSession?.id]
    },
  },
  mounted() {
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
          },
        },
      })
    )

    this.quillEditor.getModule('toolbar').addHandler('image', async () => {
      AnalyticsService.captureEvent(
        EVENTS.IMAGE_UPLOAD_USER_CLICKED_UPLOAD_IMAGE,
        {
          tool: 'document-editor-v2',
        }
      )
      this.$refs.fileDialog.openFileDialog()
    })

    // Delegate tracking the contents of the doc to Yjs instead of Quill.
    this.doc = new Doc()
    new QuillBinding(this.doc.getText('quill'), this.quillEditor)

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
      (event) => this.onImageFailedModeration(event.failures),
      false
    )

    // do not allow user to make edits until the quill doc contents are set
    this.quillEditor.disable()

    /*
     * We should read from and make text changes to `this.doc` rather than the Quill editor directly.
     * Yjs uses CRDTs internally to store and transmit changes, which are then used to resolve
     * conflicts between collaborators. This is how we ensure that the document editor stays
     * in sync for both partners during a session.
     */
    this.doc.on('update', this.quillTextChange)

    this.quillEditor.on('selection-change', this.quillSelectionChange)

    socket.on('quillStateV2', ({ updates }) => {
      for (const update of updates) {
        applyUpdate(this.doc, decode(update))
      }
      this.isLoading = false
      this.quillEditor.enable()

      this.quillEditor
        .getModule('cursors')
        .createCursor('partnerCursor', 'Partner', '#16D2AA')
    })

    socket.on('partnerQuillDeltaV2', ({ update }) => {
      applyUpdate(this.doc, decode(update))
    })

    socket.on('quillPartnerSelection', ({ range }) => {
      this.quillEditor.getModule('cursors').moveCursor('partnerCursor', range)
    })

    if (this.isConnected && this.currentSession?.id) this.requestQuillDoc()
  },
  methods: {
    toggleScreenShareErrorTooltipOpen() {
      this.showScreenShareErrorTooltip = !this.showScreenShareErrorTooltip
      if (this.showScreenShareErrorTooltip)
        AnalyticsService.captureEvent(
          EVENTS.SCREENSHARE_USER_SAW_ERROR_TOOLTIP,
          {
            tool: 'document-editor',
            userType: this.userType,
          }
        )
    },
    toggleScreenShare() {
      AnalyticsService.captureEvent(
        EVENTS.SCREENSHARE_USER_CLICKED_SCREENSHARE_BUTTON,
        {
          tool: 'document-editor',
          userType: this.userType,
        }
      )
      this.$emit('toggleScreenShareWindow')
    },
    quillTextChange(update, origin, doc) {
      // Only emit changes that are made in this component
      if (origin?.doc === doc) {
        socket.emit('transmitQuillDeltaV2', {
          sessionId: this.currentSession._id,
          update: encode(update),
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
    requestQuillDoc() {
      socket.emit('requestQuillStateV2', {
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
          this.onImageFailedModeration(failures)
          return
        }
      } catch (err) {
        AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_FAILED, {
          tool: 'document-editor-v2',
        })
        alert(
          'There was an issue analyzing the image. Please try a different image, or reach out to support@upchieve.org for assistance.'
        )
      }
      const range = this.quillEditor.getSelection()
      const b64 = await file2b64(file)
      this.quillEditor.insertEmbed(range.index, 'image', b64, 'user')
      AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_USER_UPLOADED_IMAGE, {
        tool: 'document-editor-v2',
      })
    },
    onImageFailedModeration(failures) {
      AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_IMAGE_CENSORED, {
        tool: 'document-editor-v2',
      })
      this.$store.commit('liveMedia/setModerationInfraction', {
        // @TODO This is mixing liveMedia with non-live media concerns, ugh...
        infraction: failures,
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
}

.screenshare-error {
  fill: $c-error-red;
  height: 20px;
  width: 20px;
  display: flex;
}

.m-tooltip--bottom::before {
  @include breakpoint-below('large') {
    left: -20px;
  }
  @include breakpoint-below('small') {
    left: -100px;
  }
}

select svg {
  pointer-events: none;
}

.eye-icon {
  color: $c-error-red;
}
</style>
