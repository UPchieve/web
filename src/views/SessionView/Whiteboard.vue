<template>
  <div class="zwib-wrapper" :class="toolClass">
    <reset-whiteboard-modal
      v-if="showResetWhiteboardModal"
      :setShouldResetWhiteboard="setShouldResetWhiteboard"
      :closeModal="toggleResetWhiteboardModal"
    />
    <transition name="whiteboard-warning">
      <loading-message
        message="Attempting to connect the whiteboard"
        class="whiteboard-warning whiteboard-warning--connection"
        v-show="!isConnected"
      />
    </transition>
    <div id="zwib-div" :class="{ 'whiteboard-open': isWhiteboardOpen }"></div>
    <transition name="reset-whiteboard-error">
      <p class="whiteboard-transition-error" v-show="resetWhiteboardError">
        Unable to reset the whiteboard.
      </p>
    </transition>
    <transition name="uploading-picture-error">
      <p class="whiteboard-transition-error" v-show="uploadingPictureError">
        {{ imageUploadErrorMessage }}
      </p>
    </transition>
    <div id="toolbar" class="toolbar">
      <p v-if="error" class="whiteboard-error">{{ error }}</p>
      <div v-if="showScreenShareTool" class="toolbar-item" tabindex="0">
        <Spinner
          v-if="isJoiningCall"
          height="24"
          width="24"
          container-height="24"
          container-width="24"
        />
        <span
          v-else-if="unableToJoinCall"
          @mouseenter="toggleScreenShareErrorTooltip"
          @mouseleave="toggleScreenShareErrorTooltip"
          @click="toggleScreenShareErrorTooltip"
          v-tooltip="{
            text: 'Could not load the Screen Share tool. Please refresh and try again.',
            position: 'right',
            color: 'black',
            open: screenShareErrorTooltipOpen,
          }"
        >
          <ErrorIcon class="screenshare-error" />
        </span>
        <span
          v-else-if="isLiveMediaBanned"
          v-tooltip="{
            text: 'Our automated moderation detected a potential policy issue with your shared content. For everyone’s safety, screen sharing has been temporarily disabled. We’ll manually review to confirm if this was a mistake. Thank you for your patience!',
            position: 'top',
            color: 'black',
            open: screenShareErrorTooltipOpen,
          }"
        >
          <ErrorIcon class="screenshare-error" />
        </span>
        <button v-else @click="toggleScreenShareWindow">
          <StopScreenShareIcon
            v-if="isScreenSharing"
            class="toolbar-item__svg"
          />
          <ScreenShareIcon v-else class="toolbar-item__svg" />
        </button>
      </div>
      <WhiteboardAiTutorButton
        v-if="aiWidgetEnabled"
        class="toolbar-item"
        title="Ai Tutor"
        :class="selectedTool === 'ai-tutor' ? 'selected-tool' : ''"
        :showHasAiMessageIndicator="showHasAiMessageIndicator"
        tabindex="0"
        @click="
          () => {
            selectedTool = selectedTool === 'ai-tutor' ? '' : 'ai-tutor'
            $emit('toggleAiWidget')
          }
        "
        @keydown.enter="
          () => {
            selectedTool = selectedTool === 'ai-tutor' ? '' : 'ai-tutor'
            $emit('toggleAiWidget')
          }
        "
      />
      <div
        class="toolbar-item"
        title="Pick tool"
        v-bind:class="selectedTool === 'pick' ? 'selected-tool' : ''"
        tabindex="0"
        @click="usePickTool"
        @keydown.enter="usePickTool"
      >
        <PickToolIcon class="toolbar-icon--pick" />
      </div>
      <div
        class="toolbar-item"
        title="Brushes"
        tabindex="0"
        @click="toggleBrushes"
        @keydown.enter="toggleBrushes"
        :class="
          selectedTool === 'brush' || selectedTool === 'thin-brush'
            ? 'selected-tool'
            : ''
        "
      >
        <PenIcon class="toolbar-icon--pen" />
        <div v-if="showBrushPicker" class="options-bar">
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'brush' ? 'selected-tool' : ''"
            tabindex="0"
            @click="useBrushTool"
            @keydown.enter="useBrushTool"
          >
            <ThickPenIcon class="toolbar-icon" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'thin-brush' ? 'selected-tool' : ''"
            tabindex="0"
            @click="useThinBrushTool"
            @keydown.enter="useThinBrushTool"
          >
            <ThinPenIcon class="toolbar-icon" />
          </div>
        </div>
      </div>
      <div
        v-if="isWhiteboardEraserToolActive"
        class="toolbar-item"
        :class="selectedTool === 'eraser' ? 'selected-tool' : ''"
        title="Eraser"
        tabindex="0"
        @click="useEraserTool"
        @keydown.enter="useEraserTool"
      >
        <EraserIcon class="toolbar-icon" />
      </div>
      <div
        class="toolbar-item"
        title="Upload photo"
        tabindex="0"
        @click="openFileDialog"
        @keydown.enter="openFileDialog"
      >
        <FileDialog
          ref="fileDialog"
          class="upload-photo"
          accept="image/*, image/heic"
          @file-selected="uploadPhoto"
        />
        <PhotoUploadIcon class="toolbar-icon--photo" />
      </div>
      <div
        class="toolbar-item"
        title="Shapes"
        tabindex="0"
        @click="toggleShapes"
        @keydown.enter="toggleShapes"
        :class="isShapeSelected ? 'selected-tool' : ''"
      >
        <ShapesIcon class="toolbar-icon" />
        <div v-if="showShapePicker" class="options-bar">
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'line' ? 'selected-tool' : ''"
            tabindex="0"
            @click="useLineTool"
            @keydown.enter="useLineTool"
          >
            <line-icon class="toolbar-icon--shape" title="Line tool" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'arrow' ? 'selected-tool' : ''"
            tabindex="0"
            @click="useArrowTool"
            @keydown.enter="useArrowTool"
          >
            <arrow-icon class="toolbar-icon--shape" title="Arrow tool" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'circle' ? 'selected-tool' : ''"
            tabindex="0"
            @click="useCircleTool"
            @keydown.enter="useCircleTool"
          >
            <circle-icon class="toolbar-icon--shape" title="Circle tool" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'polygon' ? 'selected-tool' : ''"
            tabindex="0"
            @click="useTriangleTool"
            @keydown.enter="useTriangleTool"
          >
            <triangle-icon class="toolbar-icon--shape" title="Triangle tool" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'rectangle' ? 'selected-tool' : ''"
            tabindex="0"
            @click="useRectangleTool"
            @keydown.enter="useRectangleTool"
          >
            <rectangle-icon
              class="toolbar-icon--shape"
              title="Rectangle tool"
            />
          </div>
          <!-- TODO: Uncomment once we have a graph paper stamp. -->
          <!-- <div -->
          <!-- class="toolbar-item option-item" -->
          <!-- :class="selectedTool === 'imagestamp' ? 'selected-tool' : ''" -->
          <!-- tabindex="0" -->
          <!-- @click="useXyGraphStampTool" -->
          <!-- @keydown.enter="useXyGraphStampTool" -->
          <!-- > -->
          <!-- <xy-graph-icon class="toolbar-icon--shape" title="Graph paper" /> -->
          <!-- </div> -->
        </div>
      </div>
      <div
        class="toolbar-item"
        title="Text"
        tabindex="0"
        @click="toggleTextPicker"
        @keydown.enter="toggleTextPicker"
        :class="
          selectedTool === 'small-text' || selectedTool === 'text'
            ? 'selected-tool'
            : ''
        "
      >
        <TextIcon class="toolbar-icon" />
        <div v-if="showTextPicker" class="options-bar">
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'text' ? 'selected-tool' : ''"
            title="Text"
            tabindex="0"
            @click="useTextTool"
            @keydown.enter="useTextTool"
          >
            <TextIcon class="toolbar-icon" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'small-text' ? 'selected-tool' : ''"
            title="Small Text"
            tabindex="0"
            @click="useSmallTextTool"
            @keydown.enter="useSmallTextTool"
          >
            <SmallTextIcon class="toolbar-icon" />
          </div>
        </div>
      </div>
      <div
        class="toolbar-item"
        title="Color picker"
        tabindex="0"
        @click="toggleColorPicker"
        @keydown.enter="toggleColorPicker"
      >
        <ColorPickerIcon class="toolbar-icon--color" />
        <div v-if="showColorPicker" class="options-bar --color">
          <div
            class="toolbar-color"
            title="Black"
            style="background-color: rgba(10, 10, 10, 1)"
            tabindex="0"
            @click="setColor('rgba(10, 10, 10, 1)')"
            @keydown.enter="setColor('rgba(10, 10, 10, 1)')"
          ></div>
          <div
            class="toolbar-color"
            title="Navy"
            style="background-color: rgba(38, 51, 190, 1)"
            tabindex="0"
            @click="setColor('rgba(38, 51, 190, 1)')"
            @keydown.enter="setColor('rgba(38, 51, 190, 1)')"
          ></div>
          <div
            class="toolbar-color"
            title="Red"
            style="background-color: rgba(244, 71, 71, 1)"
            tabindex="0"
            @click="setColor('rgba(244, 71, 71, 1)')"
            @keydown.enter="setColor('rgba(244, 71, 71, 1)')"
          ></div>
          <div
            class="toolbar-color"
            title="Sand"
            style="background-color: rgba(249, 227, 183, 1)"
            tabindex="0"
            @click="setColor('rgba(249, 227, 183, 1)')"
            @keydown.enter="setColor('rgba(249, 227, 183, 1)')"
          ></div>
          <div
            class="toolbar-color"
            title="Teal"
            style="background-color: rgba(123, 222, 201, 1)"
            tabindex="0"
            @click="setColor('rgba(123, 222, 201, 1)')"
            @keydown.enter="setColor('rgba(123, 222, 201, 1)')"
          ></div>
          <div
            class="toolbar-color"
            title="Light Blue"
            style="background-color: rgba(119, 151, 216, 1)"
            tabindex="0"
            @click="setColor('rgba(119, 151, 216, 1)')"
            @keydown.enter="setColor('rgba(119, 151, 216, 1)')"
          ></div>
          <div
            class="toolbar-color"
            title="Magenta"
            style="background-color: rgba(252, 30, 227, 1)"
            tabindex="0"
            @click="setColor('rgba(252, 30, 227, 1)')"
            @keydown.enter="setColor('rgba(252, 30, 227, 1)')"
          ></div>
          <div
            class="toolbar-color"
            title="Highlighter Green"
            style="background-color: rgba(20, 255, 20, 0.5)"
            tabindex="0"
            @click="setColor('rgba(20, 255, 20, 0.5)')"
            @keydown.enter="setColor('rgba(20, 255, 20, 0.5)')"
          ></div>
          <div
            class="toolbar-color"
            title="Highlighter Orange"
            style="background-color: rgba(255, 152, 3, 0.5)"
            tabindex="0"
            @click="setColor('rgba(255, 152, 3, 0.5)')"
            @keydown.enter="setColor('rgba(255, 152, 3, 0.5)')"
          ></div>
          <div
            class="toolbar-color"
            title="Highlighter Yellow"
            style="background-color: rgba(255, 255, 3, 0.5)"
            tabindex="0"
            @click="setColor('rgba(255, 255, 3, 0.5)')"
            @keydown.enter="setColor('rgba(255, 255, 3, 0.5)')"
          ></div>
          <div
            class="toolbar-color --transparent"
            title="Transparent"
            style="background-color: rgba(255, 255, 255, 0)"
            tabindex="0"
            @click="setColor('rgba(255, 255, 255, 0.0)')"
            @keydown.enter="setColor('rgba(255, 255, 255, 0.0)')"
          ></div>
        </div>
      </div>
      <div
        class="toolbar-item"
        title="Undo"
        tabindex="0"
        @click="undo"
        @keydown.enter="undo"
      >
        <UndoIcon class="toolbar-icon" />
      </div>
      <div
        class="toolbar-item"
        title="Redo"
        tabindex="0"
        @click="redo"
        @keydown.enter="redo"
      >
        <RedoIcon class="toolbar-icon" />
      </div>
      <div
        class="toolbar-item"
        title="Clear whiteboard"
        tabindex="0"
        @click="clearWhiteboard"
        @keydown.enter="clearWhiteboard"
      >
        <ClearIcon class="toolbar-icon" />
      </div>
      <div
        class="toolbar-item"
        title="Reset whiteboard"
        tabindex="0"
        @click="toggleResetWhiteboardModal"
        @keydown.enter="toggleResetWhiteboardModal"
      >
        <ResetIcon class="toolbar-icon--reset" />
      </div>
    </div>
    <div v-if="isLoading" class="loading-overlay">
      <loader />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import axios from 'axios'
import NetworkService from '@/services/NetworkService'
import PickToolIcon from '@/assets/whiteboard_icons/selection.svg'
import ClearIcon from '@/assets/whiteboard_icons/clear.svg'
import ColorPickerIcon from '@/assets/whiteboard_icons/color_picker.svg'
import PenIcon from '@/assets/whiteboard_icons/pen.svg'
import ThickPenIcon from '@/assets/whiteboard_icons/thick_pen.svg'
import ThinPenIcon from '@/assets/whiteboard_icons/thin_pen.svg'
import UndoIcon from '@/assets/whiteboard_icons/undo.svg'
import RedoIcon from '@/assets/whiteboard_icons/redo.svg'
import DeleteSelectionIcon from '@/assets/whiteboard_icons/delete_selection.png'
import RotateIcon from '@/assets/whiteboard_icons/rotate.png'
import PhotoUploadIcon from '@/assets/whiteboard_icons/photo-upload.svg'
import ErrorIcon from '@/assets/sidebar_icons/exclamation.svg'
import FileDialog from '@/components/FileDialog.vue'
import ShapesIcon from '@/assets/whiteboard_icons/shapes.svg'
import ArrowIcon from '@/assets/arrow.svg'
import CircleIcon from '@/assets/whiteboard_icons/circle.svg'
import RectangleIcon from '@/assets/whiteboard_icons/rectangle.svg'
import TriangleIcon from '@/assets/whiteboard_icons/triangle.svg'
import LineIcon from '@/assets/whiteboard_icons/line.svg'
import ResetIcon from '@/assets/whiteboard_icons/reset.svg'
import EraserIcon from '@/assets/whiteboard_icons/eraser.svg'
import TextIcon from '@/assets/whiteboard_icons/text_tool.svg'
import SmallTextIcon from '@/assets/whiteboard_icons/small_text_tool.svg'
import Loader from '@/components/Loader.vue'
import ResetWhiteboardModal from './ResetWhiteboardModal.vue'
import LoadingMessage from '@/components/LoadingMessage.vue'
import config from '../../config'
import heic2any from 'heic2any'
import LoggerService from '@/services/LoggerService'
import { socket } from '@/socket'
import { markRaw } from 'vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import ModerationService from '@/services/ModerationService'
import { WhiteboardNullTool } from './WhiteboardNullTool'
import WhiteboardAiTutorButton from './WhiteboardAiTutorButton.vue'
import ScreenShareIcon from '@/assets/screen-share.svg'
import StopScreenShareIcon from '@/assets/stop-screen-share.svg'
import Spinner from '@/components/Spinner.vue'
import { vTooltip } from 'maz-ui'

export default {
  directives: {
    tooltip: vTooltip,
  },
  components: {
    WhiteboardAiTutorButton,
    PickToolIcon,
    ClearIcon,
    ColorPickerIcon,
    PenIcon,
    ThickPenIcon,
    ThinPenIcon,
    UndoIcon,
    RedoIcon,
    PhotoUploadIcon,
    FileDialog,
    ShapesIcon,
    ArrowIcon,
    CircleIcon,
    RectangleIcon,
    TriangleIcon,
    LineIcon,
    ResetIcon,
    EraserIcon,
    TextIcon,
    SmallTextIcon,
    Loader,
    ResetWhiteboardModal,
    LoadingMessage,
    ScreenShareIcon,
    StopScreenShareIcon,
    Spinner,
    ErrorIcon,
  },
  props: {
    sessionId: {
      type: String,
      required: true,
    },
    isWhiteboardOpen: {
      type: Boolean,
      required: true,
    },
    toggleWhiteboard: {
      type: Function,
      required: true,
    },
    isSessionOver: {
      type: Boolean,
      required: true,
    },
    aiWidgetHidden: {
      type: Boolean,
      required: false,
      default: true,
    },
    aiWidgetEnabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    screenShareAvailable: {
      type: Boolean,
      required: false,
      default: false,
    },
    showHasAiMessageIndicator: {
      type: Boolean,
      required: false,
      default: false,
    },
    aiWidgetMoving: {
      type: Boolean,
      required: true,
    },
    isScreenSharing: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      // Zwibbler.
      zwibblerCtx: null,
      canvasHeight: 2800,
      canvasWidth: 1000,
      // Component state.
      error: '',
      isLoading: false,
      isConnected: false,
      hadConnectionIssue: false,
      pingPongInterval: null,
      uploadingPictureError: false,
      imageUploadErrorMessage: 'Unable to upload the image',
      screenShareErrorTooltipOpen: false,
      // Tools.
      // one-of: ai-tutor, pick, brush, thin-brush (i.e. brush), eraser (i.e. brush), line, arrow, circle, polygon (used for triangle), rectangle, imagestamp (used for xy graph), text, small-text (i.e. text)
      selectedTool: '',
      previouslySelectedTool: null,
      // Tool option selection.
      showBrushPicker: false,
      showShapePicker: false,
      showTextPicker: false,
      showColorPicker: false,
      // The tools that alter the default Zwibbler tool state.
      selectedEraserTool: false,
      selectedThinBrushTool: false,
      selectedSmallTextTool: false,
      // Resetting the whiteboard.
      showResetWhiteboardModal: false,
      shouldResetWhiteboard: false,
      resetWhiteboardError: false,
    }
  },
  emits: ['toggleAiWidget', 'toggleScreenShareWindow'],
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isWhiteboardEraserToolActive: 'featureFlags/isWhiteboardEraserToolActive',
      userType: 'user/userType',
      isStudent: 'user/isStudent',
      isVolunteer: 'user/isVolunteer',
      isJoiningCall: 'liveMedia/isJoiningCall',
      unableToJoinCall: 'liveMedia/unableToJoinCall',
      sessionPartner: 'user/sessionPartner',
      hasSpeakingPrivileges: 'liveMedia/audio/hasSpeakingPrivileges',
    }),
    isLiveMediaBanned() {
      return !this.hasSpeakingPrivileges
    },
    showScreenShareTool() {
      // Show to students once a volunteer is sharing their screen
      // and show to volunteers right away
      return (
        (this.isVolunteer && this.screenShareAvailable) ||
        (this.isStudent && this.unableToJoinCall)
      )
    },
    isAiWidgetHidden() {
      return this.aiWidgetHidden
    },
    toolClass() {
      if (
        this.selectedTool === 'brush' ||
        this.selectedTool === 'thin-brush' ||
        this.selectedTool === 'line' ||
        this.selectedTool === 'arrow' ||
        this.selectedTool === 'circle' ||
        this.selectedTool === 'polygon' || // i.e. triangle
        this.selectedTool === 'rectangle' ||
        this.selectedTool === 'imagestamp' // i.e. xy_graph
      ) {
        return 'zwib-wrapper--crosshair-curor'
      }

      if (this.selectedTool === 'text' || this.selectedTool === 'small-text') {
        return 'zwib-wrapper--text-cursor'
      }

      // For pick, eraser.
      return 'zwib-wrapper--default'
    },
    isShapeSelected() {
      return (
        this.selectedTool === 'line' ||
        this.selectedTool === 'arrow' ||
        this.selectedTool === 'circle' ||
        this.selectedTool === 'polygon' ||
        this.selectedTool === 'rectangle' ||
        this.selectedTool === 'xy_graph'
      )
    },
  },
  updated() {
    if (this.error) {
      setTimeout(() => {
        this.error = ''
      }, 2000)
    }
  },
  async mounted() {
    /*
     * This seems like an anti-pattern.
     * Any events sent before `created()` is called will be missed.
     * Socket listeners should ideally be defined in the socket store.
     */
    socket.on('resetwhiteboard', async () => {
      window.clearInterval(this.pingPongInterval)
      await this.zwibblerCtx.destroy()
      this.zwibblerCtx = markRaw(null)

      this.loadZwibbler()
    })

    this.loadZwibbler()
  },
  methods: {
    toggleScreenShareWindow() {
      AnalyticsService.captureEvent(
        EVENTS.SCREENSHARE_USER_CLICKED_SCREENSHARE_BUTTON,
        {
          tool: 'whiteboard',
          userType: this.userType,
        }
      )
      this.$emit('toggleScreenShareWindow')
    },
    toggleScreenShareErrorTooltip() {
      this.screenShareErrorTooltipOpen = !this.screenShareErrorTooltipOpen
      if (this.screenShareErrorTooltipOpen)
        AnalyticsService.captureEvent(
          EVENTS.SCREENSHARE_USER_SAW_ERROR_TOOLTIP,
          {
            tool: 'whiteboard',
            userType: this.userType,
          }
        )
    },
    isMobile() {
      return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    },
    resizeViewRectangle() {
      this.zwibblerCtx.setViewRectangle({
        x: 0,
        y: 0,
        width: this.canvasWidth,
        height: 1,
      })
    },
    handleOrientationChange() {
      setTimeout(this.resizeViewRectangle, 100)
    },
    handleWindowResize() {
      setTimeout(this.resizeViewRectangle, 100)
    },
    maybeFocusZwibbler(event) {
      // activate Zwibbler's keyboard cursor if a tool was selected
      // using the keyboard
      /**
       *
       * Check if the event is truthy before accessing its type.
       * There are several tools that are programmatically called
       * and are not triggered via an event. for example: the brush
       * tool is set as the default tool once Zwibbler is connected
       *
       **/
      if (event && event.type === 'keydown') {
        this.zwibblerCtx.focus(true, this)
      }
    },
    usePickTool(event) {
      this.zwibblerCtx.usePickTool()
      this.maybeFocusZwibbler(event)
    },
    useBrushTool(event) {
      this.zwibblerCtx.useBrushTool()
      this.maybeFocusZwibbler(event)
    },
    useThinBrushTool(event) {
      this.selectedThinBrushTool = true
      this.zwibblerCtx.useBrushTool({ lineWidth: 3 })
      this.maybeFocusZwibbler(event)
    },
    useEraserTool(event) {
      const layer = this.zwibblerCtx.getActiveLayer()
      this.selectedEraserTool = true
      this.zwibblerCtx.useBrushTool({
        lineWidth: 10,
        strokeStyle: 'erase',
        layer,
      })
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_WHITEBOARD_ERASER_TOOL)
      this.maybeFocusZwibbler(event)
    },
    useLineTool(event) {
      this.zwibblerCtx.useLineTool(
        {},
        {
          singleLine: true,
        }
      )
      this.maybeFocusZwibbler(event)
    },
    useArrowTool(event) {
      this.zwibblerCtx.useArrowTool()
      this.maybeFocusZwibbler(event)
    },
    useCircleTool(event) {
      this.zwibblerCtx.useCircleTool()
      this.maybeFocusZwibbler(event)
    },
    useTriangleTool(event) {
      this.zwibblerCtx.usePolygonTool(3, 0)
      this.maybeFocusZwibbler(event)
    },
    useRectangleTool(event) {
      this.zwibblerCtx.useRectangleTool()
      this.maybeFocusZwibbler(event)
    },
    useXyGraphStampTool(event) {
      this.zwibblerCtx.useStampTool(
        {
          // TODO: Get Grace to create a graph paper stamp.
          url: '',
          lockSize: false,
          width: 300,
        },
        false
      )
      this.maybeFocusZwibbler(event)
    },
    useTextTool(event) {
      this.zwibblerCtx.useTextTool()
      this.maybeFocusZwibbler(event)
    },
    useSmallTextTool(event) {
      this.selectedSmallTextTool = true
      this.zwibblerCtx.useTextTool({ fontSize: 26, fontName: 'Arial' })
      this.maybeFocusZwibbler(event)
    },
    toggleBrushes() {
      this.showBrushPicker = !this.showBrushPicker
      this.showShapePicker = false
      this.showTextPicker = false
      this.showColorPicker = false
    },
    toggleShapes() {
      this.showShapePicker = !this.showShapePicker
      this.showBrushPicker = false
      this.showTextPicker = false
      this.showColorPicker = false
    },
    toggleTextPicker() {
      this.showTextPicker = !this.showTextPicker
      this.showBrushPicker = false
      this.showShapePicker = false
      this.showColorPicker = false
    },
    toggleColorPicker() {
      this.showColorPicker = !this.showColorPicker
      this.showBrushPicker = false
      this.showTextPicker = false
      this.showShapePicker = false
      /* Since the eraser is also a `brush`, let's assume the user
       * doesn't want to erase in the color they just chose and
       * automatically switch to the brush.
       */
      if (this.selectedTool === 'eraser' && !this.showColorPicker) {
        this.useBrushTool()
      }
    },
    undo() {
      this.zwibblerCtx.undo()
      this.hideHoveredToolbars()
    },
    redo() {
      this.zwibblerCtx.redo()
      this.hideHoveredToolbars()
    },
    hideHoveredToolbars() {
      this.showBrushPicker = false
      this.showShapePicker = false
      this.showTextPicker = false
      this.showColorPicker = false
    },
    openFileDialog(event) {
      this.$refs.fileDialog.openFileDialog(event)
    },
    async showImageUploadError(message, timeMs) {
      this.uploadingPictureError = true
      this.imageUploadErrorMessage = message ?? 'Unable to upload image'
      setTimeout(() => {
        this.uploadingPictureError = false
      }, timeMs ?? 2000)
    },
    async uploadPhoto(uploadEvents) {
      const { files } = uploadEvents.fileSelectionEvent.target
      let file = files[0]
      const tenMegabytes = 10 * 1000000

      if (!this.isWhiteboardOpen && this.mobileMode) this.toggleWhiteboard()

      if (file.size > tenMegabytes) {
        this.error =
          'The photo is too large. Please upload a photo less than 10mb.'
        return
      }

      this.usePickTool(uploadEvents.dialogOpeningEvent)

      this.isLoading = true

      try {
        // Convert HEIC images to jpeg on desktop devices
        if (!this.isMobile() && file.type === 'image/heic') {
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
          })

          const fileType = convertedBlob.type.split('/')[1]
          const previousFileName = file.name.split('.')[0]
          const newFileName = `${previousFileName}.${fileType}`
          file = new File([convertedBlob], newFileName, {
            lastModified: new Date().getTime(),
          })
        }

        // Moderate the image
        const formData = new FormData()
        formData.append('image', file)
        formData.append('sessionId', this.sessionId)
        const { isClean } =
          await ModerationService.checkIfImageIsClean(formData)
        if (!isClean) {
          this.showImageUploadError(
            'The image is not appropriate. If you believe this to be an error, please contact us at support@upchieve.org',
            6000
          )
          return
        }

        const response = await NetworkService.getSessionPhotoUploadUrl(
          this.sessionId
        )
        const {
          data: { uploadUrl, imageUrl },
        } = response

        if (uploadUrl) {
          await axios.put(uploadUrl, file, {
            headers: {
              'Content-Type': file.type,
            },
          })
          this.insertPhoto(imageUrl)
        }
      } catch (error) {
        this.showImageUploadError()
        LoggerService.noticeError(error)
        return
      } finally {
        // Reset the file input
        uploadEvents.fileSelectionEvent.target.value = ''
        this.isLoading = false
      }
    },
    insertPhoto(imageUrl) {
      const nodeId = this.zwibblerCtx.createNode('ImageNode', {
        url: imageUrl,
        opacity: 0,
      })

      this.zwibblerCtx.on('resource-loaded', () => {
        const nodeDimensions = this.zwibblerCtx.getNodeRectangle(nodeId)
        const whiteboard = document.querySelector('#zwib-div')
        const whiteboardWidth = whiteboard.clientWidth
        const whiteboardHeight = whiteboard.clientHeight
        let scaleFactor = 1

        // scale image below the whiteboard width and height
        if (nodeDimensions.width > whiteboardWidth) {
          scaleFactor = 1 / (nodeDimensions.width / whiteboardWidth + 1)
          this.zwibblerCtx.scaleNode(nodeId, scaleFactor, scaleFactor)
        } else if (nodeDimensions.height > whiteboardHeight) {
          scaleFactor = 1 / (nodeDimensions.height / whiteboardHeight + 1)
          this.zwibblerCtx.scaleNode(nodeId, scaleFactor, scaleFactor)
        } else this.zwibblerCtx.scaleNode(nodeId, scaleFactor, scaleFactor)

        // Keep opacity at 0 until image has been resized (avoids flashing full size)
        this.zwibblerCtx.setNodeProperty(nodeId, 'opacity', 1)
        this.isLoading = false
      })
    },
    clearWhiteboard() {
      this.zwibblerCtx.deleteNodes(this.zwibblerCtx.getAllNodes())
    },
    setColor(color) {
      // Second parameter indicates whether the colour should affect the fill or outline colour.
      const useFill = true
      this.zwibblerCtx.setColour(color, useFill)
    },
    setSelectionHandles() {
      // Remove all pre-defined selection handles.
      this.zwibblerCtx.removeSelectionHandles()

      // Add custom selection handle for deleting selection,
      // positioned in the top-right of the selection.
      this.zwibblerCtx.addSelectionHandle(
        1.0,
        0.0,
        20,
        -30,
        DeleteSelectionIcon,
        () => this.zwibblerCtx.deleteSelection()
      )

      // Add rotation handle with custom icon,
      // positioned in the top-middle of the selection.
      this.zwibblerCtx.addSelectionHandle(
        0.5,
        0.0,
        0,
        -30,
        RotateIcon,
        'rotate'
      )

      // Re-add default scaling handles.

      // Position scaling handles at all four corners of the selection.
      this.zwibblerCtx.addSelectionHandle(0.0, 0.0, 0, 0, '', 'scale')
      this.zwibblerCtx.addSelectionHandle(1.0, 0.0, 0, 0, '', 'scale')
      this.zwibblerCtx.addSelectionHandle(1.0, 1.0, 0, 0, '', 'scale')
      this.zwibblerCtx.addSelectionHandle(0.0, 1.0, 0, 0, '', 'scale')

      // Position more scaling handles at the midpoints of each side of the selection.
      this.zwibblerCtx.addSelectionHandle(0.5, 0.0, 0, 0, '', 'scale')
      this.zwibblerCtx.addSelectionHandle(1.0, 0.5, 0, 0, '', 'scale')
      this.zwibblerCtx.addSelectionHandle(0.5, 1.0, 0, 0, '', 'scale')
      this.zwibblerCtx.addSelectionHandle(0.0, 0.5, 0, 0, '', 'scale')
    },
    setShouldResetWhiteboard(value) {
      this.shouldResetWhiteboard = value
    },
    toggleResetWhiteboardModal() {
      this.showResetWhiteboardModal = !this.showResetWhiteboardModal
    },
    async resetWhiteboard() {
      await NetworkService.resetWhiteboard({ sessionId: this.sessionId })
      window.clearInterval(this.pingPongInterval)
      await this.zwibblerCtx.destroy()
      this.setShouldResetWhiteboard(false)
      this.loadZwibbler()
      socket.emit('resetWhiteboard', {
        sessionId: this.sessionId,
      })
    },
    async loadZwibbler() {
      const zwibblerCtx = window.Zwibbler.create('zwib-div', {
        showToolbar: false,
        showColourPanel: false,
        autoPickTool: false,
        autoPickToolText: false,
        defaultBrushWidth: 5,
        allowZoom: false,
        pageView: true,
        pageInflation: 0,
        pageShadow: false,
        outsidePageColour: '#fff',
        defaultSmoothness: 'sharpest',
        multilineText: true,
        scrollbars: true,
        defaultFontSize: 32,
        background: 'grid',
        collaborationServer: `${config.websocketRoot}/whiteboard/room/{name}`,
      })

      this.zwibblerCtx = markRaw(zwibblerCtx)

      // Set paper size
      this.zwibblerCtx.setPaperSize(this.canvasWidth, this.canvasHeight)

      // Zoom to full width
      this.resizeViewRectangle()

      this.zwibblerCtx.joinSharedSession(this.sessionId, true)

      // Set up custom selection handles
      this.setSelectionHandles()

      // disable showing hints on the canvas
      this.zwibblerCtx.setConfig('showHints', false)

      // read-only until connected
      this.zwibblerCtx.setConfig('readOnly', false)
      this.zwibblerCtx.on('connected', () => {
        this.isConnected = true
        this.zwibblerCtx.setConfig('readOnly', false)
        // @todo access the connection in a less sketchy way
        // If you're using public/static/zwibbler-demo.js as your VUE_APP_ZWIBBLER_URL value,
        // then get the `zc.Pb.Pb` else assume you're using zwibbler2.js from the cdn
        const zwibblerWsConnection = this.zwibblerCtx?.zc?.Pb?.Pb
          ? this.zwibblerCtx.zc.Pb.Pb
          : this.zwibblerCtx.Ec.rc.rc
        const zwibblerOnMessage = zwibblerWsConnection.onmessage
        const zwibblerOnClose = zwibblerWsConnection.onclose
        // Intercept Zwibbler's websocket message handler
        zwibblerWsConnection.onmessage = (messageEvent) => {
          // Forward message to Zwibbler unless it's our "pong" response
          if (messageEvent.data !== 'p0ng') zwibblerOnMessage(messageEvent)
        }

        // Intercept Zwibbler's websocket close handler to throw custom error
        zwibblerWsConnection.onclose = (closeEvent) => {
          // Access Zwibbler's internal WebSocket stream name
          // Note: the properties to access will change with every new Zwibbler update
          const err = new Error(
            `WebSocket for the ${this.userType} in session ${this.sessionId} closed with code ${closeEvent.code} for reason: "${closeEvent.reason}" in room: ${
              // If you're using public/static/zwibbler-demo.js as your VUE_APP_ZWIBBLER_URL value,
              // then get the `zc.zc.Hx` else assume you're using zwibbler2.js from the cdn
              this.zwibblerCtx?.zc?.Hx
                ? this.zwibblerCtx.zc.Hx
                : this.zwibblerCtx.Ec.cC
            }`
          )
          LoggerService.noticeError(err)
          zwibblerOnClose(closeEvent)
        }

        // Ping server every 45 seconds to keep the connection open
        this.pingPongInterval = window.setInterval(() => {
          zwibblerWsConnection.send('p1ng')
        }, 45 * 1000)

        // Set brush tool to default tool
        this.useBrushTool()

        this.resizeViewRectangle()

        // Don't start setting selected tool until connected
        this.zwibblerCtx.on('tool-changed', (toolname) => {
          // The eraser uses the brush tool. In order to make it seem as the eraser
          // is active for the user, we're overriding the selectedTool to be
          // `eraser` instead of `brush`
          if (this.selectedEraserTool) {
            this.selectedEraserTool = false
            this.selectedTool = 'eraser'
          } else if (this.selectedThinBrushTool) {
            this.selectedThinBrushTool = false
            this.selectedTool = 'thin-brush'
          } else if (this.selectedSmallTextTool) {
            this.selectedSmallTextTool = false
            this.selectedTool = 'small-text'
          } else {
            this.selectedTool = toolname
          }
          this.hideHoveredToolbars()
        })
      })

      this.zwibblerCtx.on('connect-error', () => {
        this.isConnected = false
        this.hadConnectionIssue = true
        window.clearInterval(this.pingPongInterval)
        this.zwibblerCtx.setConfig('readOnly', true)
      })

      // disallow dragging and pasting to the whiteboard
      this.zwibblerCtx.on('paste', () => {
        return false
      })

      window.addEventListener(
        'orientationchange',
        this.handleOrientationChange,
        false
      )

      window.addEventListener('resize', this.handleWindowResize, false)

      this.zwibblerCtx.on('document-changed', (info) => {
        const isRemoteChange = info && info.remote
        const isWhiteboardHidden = this.mobileMode && !this.isWhiteboardOpen
        const shouldResizeView = isRemoteChange && isWhiteboardHidden
        /**
         * If mobile user is viewing chat when new whiteboard changes are made,
         * resize the view so they can see everything on the whiteboard
         */
        if (shouldResizeView) {
          /**
           * Note: this event can fire before the new doc changes are available in the whiteboard context,
           * so we wait 500ms before calling `getAllNodes`
           */
          setTimeout(() => {
            // Set the Zwibbler view to a rectangle that fits all whiteboard nodes
            try {
              this.zwibblerCtx.setViewRectangle(
                this.zwibblerCtx.getBoundingRectangle(
                  this.zwibblerCtx.getAllNodes()
                )
              )
            } catch (error) {
              this.resizeViewRectangle()
            }
          }, 500)
        }
      })
    },
  },
  beforeUnmount() {
    window.removeEventListener(
      'orientationchange',
      this.handleOrientationChange,
      false
    )
    window.removeEventListener('resize', this.handleWindowResize, false)
    window.clearInterval(this.pingPongInterval)
    // zwibbler cleanup
    // This method doesn't exist in zwibbler-demo.js
    if (this.zwibblerCtx?.leaveSharedSession) {
      this.zwibblerCtx.leaveSharedSession()
    }
    this.zwibblerCtx.destroy()
  },
  watch: {
    aiWidgetMoving(current) {
      /*
      This method prevents the selected tool (e.g. brush) from
      drawing all over the whiteboard while you're moving or resizing the AI window.
      We're storing the current tool, then setting current tool to WhiteboardNullTool (i.e. nothing)
      when the dragging or reszing starts.

      Then when the resizing ends, we restore the previous selection
    */
      if (current) {
        this.previouslySelectedTool = this.selectedTool
        this.zwibblerCtx.useCustomTool(new WhiteboardNullTool())
        this.selectedTool = ''
      } else {
        this.selectedTool = this.previouslySelectedTool
        switch (this.selectedTool) {
          case 'pick':
            this.usePickTool()
            break
          case 'brush':
            this.useBrushTool()
            break
          case 'thin-brush':
            this.userThinBrushTool()
            break
          case 'eraser':
            this.useEraserTool()
            break
          case 'line':
            this.useLineTool()
            break
          case 'arrow':
            this.useArrowTool()
            break
          case 'circle':
            this.useCircleTool()
            break
          case 'polygon':
            this.useTriangleTool()
            break
          case 'rectangle':
            this.useRectangleTool()
            break
          case 'stamp':
            this.useXyGraphStampTool()
            break
          case 'text':
            this.useTextTool()
            break
          case 'small-text':
            this.useSmallTextTool()
            break
          default:
            this.usePickTool()
        }
        this.previouslySelectedTool = ''
      }
    },
    isAiWidgetHidden(isHidden) {
      if (isHidden) {
        this.selectedTool = ''
      }
    },
    isSessionOver(isSessionOver, oldIsSessionOver) {
      if (isSessionOver && !oldIsSessionOver)
        this.zwibblerCtx.setConfig('readOnly', true)
    },
    shouldResetWhiteboard(currentValue) {
      if (currentValue) this.resetWhiteboard()
    },
  },
}
</script>

<style lang="scss">
.zwib-wrapper {
  height: 100%;
  width: 100%;
  position: relative;

  &--crosshair-cursor {
    cursor: crosshair !important;
  }

  &--text-cursor {
    cursor: text !important;
  }

  &--default-cursor {
    cursor: default !important;
  }
}

#zwib-div {
  height: 100%;
  width: 100%;

  &.whiteboard-open {
    @media only screen and (orientation: landscape) and (max-height: 500px) {
      position: fixed !important;
      top: 0;
      left: 0;
      background: #fff;
      z-index: 100;
    }
  }
}

.zwibbler-canvas-holder,
.zwib-wrapper,
.zwibbler-overlay,
#zwib-div {
  outline: none !important;
  &:focus {
    outline: none !important;
  }
}

.zwibbler-scrollbar {
  cursor: default;
}

.toolbar {
  max-width: 550px;
  height: 70px;
  position: absolute;
  bottom: 50px;
  left: 0;
  right: 20px;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-radius: 8px;
  background-color: rgb(238, 238, 238);

  @include breakpoint-above('medium') {
    position: absolute;
    bottom: 40px;
  }

  @include breakpoint-latest-iphones {
    max-width: 100%;
    height: 100px;
    bottom: 0;
    border-radius: 0;
  }

  @media only screen and (orientation: landscape) and (max-height: 500px) {
    bottom: 0;
  }
}

.toolbar-item {
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  @include breakpoint-below('tiny') {
    padding: 0;
  }

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:last-child {
    border-radius: 0 8px 8px 0;
  }

  &:hover {
    cursor: pointer;
  }

  &:not(.selected-tool):hover {
    background: #e2e2e2;
  }

  .option-item {
    border-radius: initial;
    padding: 0.5em;

    @include breakpoint-below('tiny') {
      padding: 1em;
    }
  }
}

.toolbar-icon {
  width: 25px;

  &--pen {
    width: 22px;
  }

  &--pick {
    padding: 3px 0 0 3px;
  }

  &--photo {
    height: 26px;
  }

  &--shape {
    height: 20px;
    width: 20px;
  }

  &--color {
    height: 25px;
    width: 25px;
  }

  &--reset {
    width: 28px;
  }
}

.toolbar-color {
  border: 2px solid #fff;
  border-radius: 100%;
  height: 22px;
  cursor: pointer;
  width: 22px;

  &:hover {
    border-color: #ccc;
  }

  &:active {
    outline: none;
  }

  &.--transparent {
    border: 1px solid #444;
    height: 18px;
    margin-top: 2px;
    margin-left: 2px;
    margin-right: 2px;
    width: 18px;

    &:hover {
      outline: 2px solid #ccc;
    }
  }
}

.options-bar {
  @include flex-container(row, space-around);
  background-color: #fff;
  border: 1px solid #d8d8d8;
  border-radius: 5px;
  bottom: 58px;
  margin: 0;
  position: absolute;

  &.--color {
    padding: 10px 8px;
  }

  @include breakpoint-latest-iphones {
    bottom: 88px;
  }
}

.selected-tool {
  background-color: darken(#e2e2e2, 15%);
}

.upload-photo {
  display: none !important;
}

.whiteboard-error {
  color: $c-error-red;
  position: absolute;
  bottom: 65px;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.whiteboard-transition-error {
  width: 100%;
  background-color: $c-error-red;
  color: #fff;
  font-weight: normal;
  min-height: 40px;
  position: absolute;
  left: 0;
  top: 0;
  padding: 12px;
  z-index: 1;
  transition: all 0.15s ease-in;

  &-enter,
  &-leave-to {
    top: -64px;
  }
}

.whiteboard-warning {
  width: 100%;
  background-color: $c-shadow-warn;
  color: #fff;
  font-weight: normal;
  min-height: 40px;
  // !important is used to override the position specified in the LoadingMessage component
  position: absolute !important;
  left: 0;
  top: 0;
  padding: 12px;
  z-index: 1000;
  transition: all 0.15s ease-in;

  &--connection {
    background-color: rgba(110, 140, 171, 0.87);
  }
}

#zwib-div:focus-visible,
#zwib-div canvas:focus-visible {
  border: 1px solid #000;
}

.screenshare-error {
  fill: $c-error-red;
  height: 26px;
  width: 26px;
}
</style>
