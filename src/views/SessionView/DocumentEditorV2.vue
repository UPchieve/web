<template>
  <div class="document-editor" data-document-editor-version="2">
    <div id="ql-toolbar">
      <select class="ql-size"></select>
      <button class="ql-bold" />
      <button class="ql-italic" />
      <button class="ql-underline" />
      <button class="ql-strike" />
      <button class="ql-image" />
      <select class="ql-color"></select>
      <select class="ql-background"></select>
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

      <word-count
        class="ql-word-count"
        :text="text"
        :selected-text="selectedText"
      />
    </div>

    <div id="quill-container"></div>
    <transition name="document-loading">
      <loading-message
        v-if="loadingText"
        :message="loadingText"
        class="document-loading document-loading--connection"
      />
    </transition>

    <FileDialog
      accept="image/png, image/jpeg, image/webp, image/heic"
      ref="fileDialog"
      @file-selected="onFileSelected"
      @file-too-large="onFileTooLarge"
      :maxFileSizeBytes="MAX_IMAGE_FILE_SIZE_BYTES"
      :disabled="loadingText"
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
import { vTooltip } from 'maz-ui'
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
import ScreenShareIcon from '@/assets/screen-share.svg'
import StopScreenShareIcon from '@/assets/stop-screen-share.svg'
import ErrorIcon from '@/assets/icons/exclamation.svg'
import LoggerService from '@/services/LoggerService'
import ActivityDot from '@/components/ActivityDot.vue'
import Spinner from '@/components/Spinner.vue'
import WordCount from '@/components/WordCount.vue'
import EyeIcon from '@/assets/eye.svg'
import {
  processImage,
  getImageTooLargeMessage,
  isAllowedImageMime,
} from '@/utils/image-pipeline'
import { BYTES_PER_MEGABYTE } from '@/utils/bytes'
import { ImageDropPaste } from '@/quill/modules/image'
import { TEN_SECONDS_TO_MS } from '@/utils/time-utils'
import {
  IMAGE_UPLOAD_EVENTS,
  getPartnerUploadingMsg,
  IMAGE_UPLOADING_STATE_MESSAGES,
  getPartnerUploadFailedMsg,
  PARTNER_IMAGE_UPLOAD_STATUS,
} from '@/composables/imageUploadState'

Quill.register('modules/cursors', QuillCursors)
Quill.register('modules/image', ImageDropPaste)

const encode = (array) => array.toString()
const decode = (str) => Uint8Array.from(str.split(',').map(Number))
const DEFAULT_IMAGE_QUALITY = 0.8

export default {
  directives: {
    tooltip: vTooltip,
  },
  components: {
    FileDialog,
    LoadingMessage,
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
      loadingText: 'Loading the document editor',
      incomingDeltas: [],
      retries: 0,
      showScreenShareErrorTooltip: false,
      // For determining word counts.
      text: '',
      selectedText: '',
      uploadingImageTimeout: null,
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
      isUpdatedDocEditorImageStorageEnabled:
        'featureFlags/isUpdatedDocEditorImageStorageEnabled',
      partnerImageUploadError: 'socket/partnerImageUploadError',
      partnerImageUploadStatus: 'socket/partnerImageUploadStatus',
    }),
    showScreenShareTool() {
      // Show to students once a volunteer is sharing their screen
      // and show to volunteers right away
      return this.isScreenShareEnabled
    },
    isSocketReadyToRequestForDoc() {
      return [this.isConnected, this.currentSession?.id]
    },
    MAX_IMAGE_FILE_SIZE_BYTES() {
      return BYTES_PER_MEGABYTE * 10
    },
  },
  beforeUnmount() {
    this.$store.dispatch('socket/resetPartnerImageUploadStatus')
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
            processAndInsertImage: this.processAndInsertImage,
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

      if (!this.uploadingImageTimeout) {
        this.loadingText = null
      }
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
    clearUploadImageTimeout() {
      if (this.uploadingImageTimeout) {
        clearTimeout(this.uploadingImageTimeout)
        this.uploadingImageTimeout = null
      }
    },
    async showErrorToast(message) {
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
    },
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
      this.$emit('clickedShareScreen')
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

      this.selectedText = range
        ? this.quillEditor.getText(range.index, range.length)
        : ''
    },
    requestQuillDoc() {
      socket.emit('requestQuillStateV2', {
        sessionId: this.currentSession.id,
      })
    },
    async onFileSelected(evt) {
      const file = evt.files[0]
      await this.processAndInsertImage(file)
      evt.fileSelectionEvent.target.value = ''
    },
    async processAndInsertImage(file) {
      if (!isAllowedImageMime(file.type)) return this.onWrongFileType()
      if (file.size > this.MAX_IMAGE_FILE_SIZE_BYTES)
        return this.onFileTooLarge()

      this.loadingText =
        IMAGE_UPLOADING_STATE_MESSAGES.SENDER[
          IMAGE_UPLOAD_EVENTS.MODERATING_IMAGE
        ]
      socket.emit(IMAGE_UPLOAD_EVENTS.MODERATING_IMAGE, {
        sessionId: this.currentSession.id,
      })

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
          socket.emit(IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_FAILED, {
            sessionId: this.currentSession.id,
            moderationFailures: failures,
          })
          this.onImageFailedModeration(failures)
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

        socket.emit(IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_SUCCESS, {
          sessionId: this.currentSession.id,
        })

        AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_USER_UPLOADED_IMAGE, {
          tool: 'document-editor-v2',
        })
      } catch {
        socket.emit(IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_FAILED, {
          sessionId: this.currentSession.id,
          uploadError: true,
        })
        AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_FAILED, {
          tool: 'document-editor-v2',
        })

        this.showErrorToast(
          IMAGE_UPLOADING_STATE_MESSAGES.SENDER[
            IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_FAILED
          ]
        )
      } finally {
        this.loadingText = null
        this.clearUploadImageTimeout()
      }
    },
    onFileTooLarge() {
      const imageTooLargeMessage = getImageTooLargeMessage(
        this.MAX_IMAGE_FILE_SIZE_BYTES
      )
      this.showErrorToast(imageTooLargeMessage)
    },
    onWrongFileType() {
      this.showErrorToast(
        `That file type isn't supported. Please upload an image.`
      )
    },
    onImageFailedModeration(failures, isPartnerFailure) {
      AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_IMAGE_CENSORED, {
        tool: 'document-editor-v2',
      })

      this.$store.commit('liveMedia/setModerationInfraction', {
        // @TODO This is mixing liveMedia with non-live media concerns, ugh...
        infraction: failures,
        isBanned: false,
        source: isPartnerFailure
          ? this.isStudent
            ? 'session_partner_coach_image_upload'
            : 'session_partner_student_image_upload'
          : 'image_upload',
        occurredAt: new Date(),
      })
    },
  },
  watch: {
    partnerImageUploadStatus(newValue, oldValue) {
      if (newValue != oldValue) {
        this.clearUploadImageTimeout()

        switch (newValue) {
          case PARTNER_IMAGE_UPLOAD_STATUS.PARTNER_UPLOADING:
            this.loadingText = getPartnerUploadingMsg(this.isStudent)
            this.uploadingImageTimeout = setTimeout(() => {
              if (this.loadingText && this.uploadingImageTimeout) {
                this.uploadingImageTimeout = null
                this.showErrorToast(getPartnerUploadFailedMsg(this.isStudent))
                this.loadingText = null
                this.$store.dispatch('socket/resetPartnerImageUploadStatus')
              }
            }, TEN_SECONDS_TO_MS)
            break
          case PARTNER_IMAGE_UPLOAD_STATUS.GENERAL_ERROR:
            this.showErrorToast(getPartnerUploadFailedMsg(this.isStudent))
            this.loadingText = null
            break
          case PARTNER_IMAGE_UPLOAD_STATUS.MODERATION_FAILURE:
            this.onImageFailedModeration(this.partnerImageUploadError, true)
            this.loadingText = null
            break
          case PARTNER_IMAGE_UPLOAD_STATUS.SUCCESS:
            this.loadingText = null
            break
        }
      }
    },
    isSessionConnectionAlive(newValue, oldValue) {
      if (
        (newValue && !oldValue) ||
        (this.isSessionRecapDmsActive && this.isVolunteer)
      ) {
        // socket.io just reconnected, allow edits to the document editor
        // or the volunteer is able to send DMs after the session ends
        this.quillEditor.enable()
        this.loadingText = null
      } else {
        this.clearUploadImageTimeout()
        this.quillEditor.disable()
        this.loadingText = 'Attempting to connect the document editor'
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

  &--error {
    background-color: $c-error-red;
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

.ql-picker-label svg {
  pointer-events: none;
}

.eye-icon {
  color: $c-error-red;
}
</style>
