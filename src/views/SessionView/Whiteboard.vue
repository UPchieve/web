<template>
  <div class="zwib-wrapper" :class="toolClass">
    <transition name="whiteboard-warning">
      <div
        v-if="hasConnectionFailure"
        class="whiteboard-warning whiteboard-warning--failure"
      >
        Failed to connect to the whiteboard. Please refresh your page.
      </div>
      <loading-message
        message="Attempting to connect the whiteboard"
        class="whiteboard-warning whiteboard-warning--connection"
        v-else-if="!isConnected"
      />
    </transition>
    <div
      id="zwib-div"
      ref="zwibDiv"
      :class="{ 'whiteboard-open': isWhiteboardOpen }"
    ></div>
    <transition name="uploading-picture-error">
      <p class="whiteboard-transition-error" v-show="uploadingPictureError">
        {{ imageUploadErrorMessage }}
      </p>
    </transition>
    <div id="partner-cursor" ref="partnerCursor"></div>
    <div id="partner-arrow" ref="partnerArrow"></div>
    <div v-if="useInfiniteWhiteboard && isConnected" class="zoom-toolbar">
      <announcement
        localStorageKey="showInfiniteWhiteboardAnnouncement"
        title="Infinite Whiteboard!"
        :body="`We're experimenting with infinite whiteboard, available to a select group only.\n\nYou can find additional tools for interacting with the infinite whiteboard in this toolbar.`"
        :position="{ right: '110%' }"
        :showEvent="EVENTS.INFINITE_WHITEBOARD_ANNOUNCEMENT_SEEN"
        :closeEvent="EVENTS.INFINITE_WHITEBOARD_ANNOUNCEMENT_CLOSED"
      />
      <button
        class="toolbar-item"
        title="Pan tool"
        v-bind:class="selectedTool === 'pan' ? 'selected-tool' : ''"
        tabindex="0"
        @click="usePanTool"
        @keydown.enter="usePanTool"
      >
        <PanToolIcon class="toolbar-icon--pick" />
      </button>
      <button
        v-if="showGoToRecentNodesButton"
        class="toolbar-item go-to-action"
        title="Go to last action"
        tabindex="0"
        @click="goToRecentNodes"
        @keydown.enter="goToRecentNodes"
      >
        <NewBadgeIcon class="toolbar-icon" />
      </button>
      <button
        v-if="showZoomOptions"
        class="toolbar-item"
        title="Zoom to fit all content"
        tabindex="0"
        @click="zoomToFit"
        @keydown.enter="zoomToFit"
      >
        <ZoomToFitIcon class="toolbar-icon" />
      </button>
      <button
        v-if="showZoomOptions"
        class="toolbar-item"
        title="Zoom out"
        tabindex="0"
        @click="zoomOut"
        @keydown.enter="zoomOut"
      >
        <ZoomOutIcon class="toolbar-icon" />
      </button>
      <button
        v-if="showZoomOptions"
        class="toolbar-item"
        title="Zoom in"
        tabindex="0"
        @click="zoomIn"
        @keydown.enter="zoomIn"
      >
        <ZoomInIcon class="toolbar-icon" />
      </button>
      <button
        class="toolbar-item"
        title="More zoom options"
        tabindex="0"
        @click="() => (showZoomOptions = !showZoomOptions)"
        @keydown.enter="() => (showZoomOptions = !showZoomOptions)"
      >
        <DoubleArrowIcon
          class="toolbar-icon"
          :class="showZoomOptions ? 'rotate-up' : 'rotate-down'"
        />
      </button>
    </div>
    <div id="toolbar" class="toolbar">
      <p v-if="error" class="whiteboard-error">{{ error }}</p>
      <div
        v-if="screenShareAvailable"
        class="toolbar-item"
        tabindex="0"
        :disabled="isViewingPartnerScreenShare ? true : false"
      >
        <Spinner
          v-if="isJoiningCall"
          :height="24"
          :width="24"
          :container-height="24"
          :container-width="24"
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
        <button
          v-else-if="isViewingPartnerScreenShare"
          class="toolbar-item"
          :class="selectedTool === 'screen-share' ? 'selected-tool' : ''"
          :disabled="isViewingPartnerScreenShare"
          v-tooltip="{
            text: `You can't share your screen while your partner is sharing.`,
            position: 'top',
            color: 'black',
          }"
        >
          <EyeIcon class="toolbar-item__svg eye-icon" />
        </button>
        <button
          v-else
          class="toolbar-item"
          @click="
            () => {
              if (!isViewingPartnerScreenShare) {
                toggleScreenShareWindow()
              }
            }
          "
          :class="selectedTool === 'screen-share' ? 'selected-tool' : ''"
          :disabled="isViewingPartnerScreenShare"
        >
          <StopScreenShareIcon
            v-if="isScreenSharing"
            class="toolbar-item__svg"
          />
          <StartScreenShareButton v-else class="toolbar-item__svg" />
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
      <button
        class="toolbar-item"
        title="Pick tool"
        v-bind:class="selectedTool === 'pick' ? 'selected-tool' : ''"
        tabindex="0"
        @click="usePickTool"
        @keydown.enter="usePickTool"
        :disabled="!isConnected"
      >
        <PickToolIcon class="toolbar-icon--pick" />
      </button>
      <button
        class="toolbar-item"
        title="Brushes"
        tabindex="0"
        @click="clickBrushTool"
        @keydown.enter="clickBrushTool"
        :class="
          selectedTool === 'brush' || selectedTool === 'thin-brush'
            ? 'selected-tool'
            : ''
        "
        :disabled="!isConnected"
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
      </button>
      <button
        class="toolbar-item"
        :class="selectedTool === 'eraser' ? 'selected-tool' : ''"
        title="Eraser"
        tabindex="0"
        @click="useEraserTool"
        @keydown.enter="useEraserTool"
        :disabled="!isConnected"
      >
        <EraserIcon class="toolbar-icon" />
      </button>
      <button
        class="toolbar-item"
        title="Upload photo"
        tabindex="0"
        @click="openFileDialog"
        @keydown.enter="openFileDialog"
        :disabled="!isConnected"
      >
        <FileDialog
          ref="fileDialog"
          class="upload-photo"
          accept="image/*, image/heic"
          @file-selected="uploadPhoto"
        />
        <PhotoUploadIcon class="toolbar-icon--photo" />
      </button>
      <button
        class="toolbar-item"
        title="Shapes"
        tabindex="0"
        @click="toggleShapes"
        @keydown.enter="toggleShapes"
        :class="isShapeSelected ? 'selected-tool' : ''"
        :disabled="!isConnected"
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
      </button>
      <button
        class="toolbar-item"
        title="Text"
        tabindex="0"
        @click="clickTextPicker"
        @keydown.enter="toggleTextPicker"
        :class="
          selectedTool === 'small-text' || selectedTool === 'text'
            ? 'selected-tool'
            : ''
        "
        :disabled="!isConnected"
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
      </button>
      <button
        class="toolbar-item"
        title="Color picker"
        tabindex="0"
        @click="toggleColorPicker"
        @keydown.enter="toggleColorPicker"
        :disabled="!isConnected"
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
      </button>
      <button
        class="toolbar-item"
        title="More"
        tabindex="0"
        @click="toggleMoreMenu"
        @keydown.enter="toggleMoreMenu"
        :disabled="!isConnected"
      >
        <MoreIcon class="toolbar-icon" />
        <div v-if="showMoreMenu" class="options-bar --more-menu">
          <div
            class="toolbar-item option-item"
            title="Undo"
            tabindex="0"
            @click="undo"
            @keydown.enter="undo"
          >
            <UndoIcon class="toolbar-icon" />
          </div>
          <div
            class="toolbar-item option-item"
            title="Redo"
            tabindex="0"
            @click="redo"
            @keydown.enter="redo"
          >
            <RedoIcon class="toolbar-icon" />
          </div>
          <div
            class="toolbar-item option-item"
            title="Clear whiteboard"
            tabindex="0"
            @click="clearWhiteboard"
            @keydown.enter="clearWhiteboard"
          >
            <ClearIcon class="toolbar-icon" />
          </div>
        </div>
      </button>
    </div>
    <div v-if="isLoading" class="loading-overlay">
      <loader />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import axios from 'axios'
import { backOff } from 'exponential-backoff'
import NetworkService from '@/services/NetworkService'
import PickToolIcon from '@/assets/whiteboard_icons/selection.svg'
import MoreIcon from '@/assets/VerticalMenuButtons.svg'
import PanToolIcon from '@/assets/whiteboard_icons/pan.svg'
import NewBadgeIcon from '@/assets/whiteboard_icons/new_badge.svg'
import ZoomInIcon from '@/assets/whiteboard_icons/zoom_in.svg'
import ZoomOutIcon from '@/assets/whiteboard_icons/zoom_out.svg'
import ClearIcon from '@/assets/whiteboard_icons/clear.svg'
import ColorPickerIcon from '@/assets/whiteboard_icons/color_picker.svg'
import PenIcon from '@/assets/whiteboard_icons/pen.svg'
import ThickPenIcon from '@/assets/whiteboard_icons/thick_pen.svg'
import ThinPenIcon from '@/assets/whiteboard_icons/thin_pen.svg'
import UndoIcon from '@/assets/whiteboard_icons/undo.svg'
import RedoIcon from '@/assets/whiteboard_icons/redo.svg'
import ZoomToFitIcon from '@/assets/whiteboard_icons/zoom_to_fit.svg'
import DoubleArrowIcon from '@/assets/whiteboard_icons/double_arrow.svg'
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
import EraserIcon from '@/assets/whiteboard_icons/eraser.svg'
import EyeIcon from '@/assets/eye.svg'
import TextIcon from '@/assets/whiteboard_icons/text_tool.svg'
import SmallTextIcon from '@/assets/whiteboard_icons/small_text_tool.svg'
import Announcement from '@/components/Announcement.vue'
import Loader from '@/components/Loader.vue'
import LoadingMessage from '@/components/LoadingMessage.vue'
import config from '../../config'
import heic2any from 'heic2any'
import LoggerService from '@/services/LoggerService'
import { markRaw } from 'vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import ModerationService from '@/services/ModerationService'
import { WhiteboardNullTool } from './WhiteboardNullTool'
import WhiteboardAiTutorButton from './WhiteboardAiTutorButton.vue'
import StopScreenShareIcon from '@/assets/stop-screen-share.svg'
import Spinner from '@/components/Spinner.vue'
import { vTooltip } from 'maz-ui'
import StartScreenShareButton from './StartScreenShareButton.vue'

const TOOLS = {
  BRUSH: 'brush',
  THIN_BRUSH: 'thin-brush',
  TEXT: 'text',
  SMALL_TEXT: 'small-text',
}

export default {
  directives: {
    tooltip: vTooltip,
  },
  components: {
    WhiteboardAiTutorButton,
    PickToolIcon,
    MoreIcon,
    PanToolIcon,
    NewBadgeIcon,
    ClearIcon,
    ColorPickerIcon,
    ZoomInIcon,
    ZoomOutIcon,
    PenIcon,
    ThickPenIcon,
    ThinPenIcon,
    UndoIcon,
    RedoIcon,
    ZoomToFitIcon,
    DoubleArrowIcon,
    PhotoUploadIcon,
    FileDialog,
    ShapesIcon,
    ArrowIcon,
    CircleIcon,
    RectangleIcon,
    TriangleIcon,
    LineIcon,
    EraserIcon,
    TextIcon,
    SmallTextIcon,
    Announcement,
    Loader,
    LoadingMessage,
    StopScreenShareIcon,
    Spinner,
    ErrorIcon,
    StartScreenShareButton,
    EyeIcon,
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
    isViewingPartnerScreenShare: {
      type: Boolean,
      required: true,
    },
    isJoiningCall: {
      type: Boolean,
      required: true,
    },
    unableToJoinCall: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      EVENTS,
      // Zwibbler.
      zwibblerCtx: null,
      canvasHeight: 2800,
      canvasWidth: 1000,
      // Component state.
      error: '',
      isLoading: false,
      isConnected: false,
      hasConnectionFailure: false,
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
      showMoreMenu: false,
      showZoomOptions: false,
      // The tools that alter the default Zwibbler tool state.
      selectedEraserTool: false,
      selectedThinBrushTool: false,
      selectedSmallTextTool: false,
      lastSelectedBrushType: TOOLS.BRUSH,
      lastSelectedTextSize: TOOLS.TEXT,
      // Infinite whiteboard and cursor.
      lastCursorBroadcastAt: 0,
      useInfiniteWhiteboard: false,
      // Go to last action button.
      showGoToRecentNodesButton: false,
      recentNodesOutsideView: [],
      initialNodesLoaded: false,
    }
  },
  emits: ['toggleAiWidget', 'clickedShareScreen'],
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isInfiniteWhiteboardEnabled: 'featureFlags/isInfiniteWhiteboardEnabled',
      userType: 'user/userType',
      isStudent: 'user/isStudent',
      isVolunteer: 'user/isVolunteer',
      sessionPartner: 'user/sessionPartner',
      isBanned: 'user/banType',
    }),
    isLiveMediaBanned() {
      return this.isBanned
    },
    isAiWidgetHidden() {
      return this.aiWidgetHidden
    },
    toolClass() {
      if (
        this.selectedTool === TOOLS.BRUSH ||
        this.selectedTool === TOOLS.THIN_BRUSH ||
        this.selectedTool === TOOLS.BRUSH ||
        this.selectedTool === TOOLS.THIN_BRUSH ||
        this.selectedTool === 'line' ||
        this.selectedTool === 'arrow' ||
        this.selectedTool === 'circle' ||
        this.selectedTool === 'polygon' || // i.e. triangle
        this.selectedTool === 'rectangle' ||
        this.selectedTool === 'imagestamp' // i.e. xy_graph
      ) {
        return 'zwib-wrapper--crosshair-curor'
      }

      if (
        this.selectedTool === TOOLS.TEXT ||
        this.selectedTool === TOOLS.SMALL_TEXT
      ) {
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
      this.usePickTool()
      this.$emit('clickedShareScreen')
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
    addInfiniteSizeListeners() {
      const zwibDiv = this.$refs.zwibDiv
      zwibDiv.addEventListener('mousemove', this.moveMouseEvent)
      zwibDiv.addEventListener(
        'mouseleave',
        this.setSessionKey.bind(null, 'isCursorOnCanvas', false, false)
      )
      zwibDiv.addEventListener(
        'mouseenter',
        this.setSessionKey.bind(null, 'isCursorOnCanvas', true, false)
      )
    },
    removeInfiniteSizeListeners() {
      const zwibDiv = this.$refs.zwibDiv
      zwibDiv.removeEventListener('mousemove', this.moveMouseEvent)
      zwibDiv.removeEventListener(
        'mouseleave',
        this.setSessionKey.bind(null, 'isCursorOnCanvas', false, false)
      )
      zwibDiv.removeEventListener(
        'mouseenter',
        this.setSessionKey.bind(null, 'isCursorOnCanvas', true, false)
      )
    },
    moveMouseEvent(event) {
      const now = Date.now()
      if (now - this.lastCursorBroadcastAt < 100) return

      this.lastCursorBroadcastAt = now
      // Get the x,y coordinates of the cursor within the Zwibbler canvas.
      const point = this.zwibblerCtx.getDocumentCoordinates(
        event.pageX,
        event.pageY
      )
      this.zwibblerCtx.setSessionKey(
        'cursorPosition',
        {
          x: point.x,
          y: point.y,
        },
        false
      )
    },
    setSessionKey(key, value, persist) {
      this.zwibblerCtx.setSessionKey(key, value, persist)
    },
    addFixedSizeListeners() {
      window.addEventListener('orientationchange', this.handleOrientationChange)
      window.addEventListener('resize', this.handleWindowResize)
    },
    removeFixedSizeListeners() {
      window.removeEventListener(
        'orientationchange',
        this.handleOrientationChange
      )
      window.removeEventListener('resize', this.handleWindowResize)
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
    clickBrushTool(event) {
      this.toggleBrushes(event)

      if (
        this.showBrushPicker &&
        this.selectedTool !== TOOLS.BRUSH &&
        this.selectedTool !== TOOLS.THIN_BRUSH
      ) {
        if (this.lastSelectedBrushType === TOOLS.BRUSH) {
          this.useBrushTool(event)
        } else {
          this.useThinBrushTool(event)
        }
      }

      this.zwibblerCtx.on('draw', () => {
        if (this.showBrushPicker) {
          this.showBrushPicker = false
        }
      })
    },
    clickTextPicker() {
      this.toggleTextPicker()

      if (
        this.showTextPicker &&
        this.selectedTool !== TOOLS.SMALL_TEXT &&
        this.selectedTool !== TOOLS.TEXT
      ) {
        if (this.lastSelectedTextSize === TOOLS.TEXT) {
          this.useTextTool()
        } else {
          this.useSmallTextTool()
        }
      }

      this.zwibblerCtx.on('edit-text-shown', () => {
        if (this.showTextPicker) {
          this.showTextPicker = false
        }
      })
    },
    clickBrushOnce(event) {
      this.toggleBrushes(event)

      if (
        this.showBrushPicker &&
        this.selectedTool !== TOOLS.BRUSH &&
        this.selectedTool !== TOOLS.THIN_BRUSH
      ) {
        if (this.lastSelectedBrushType === TOOLS.BRUSH) {
          this.useBrushTool(event)
        } else {
          this.useThinBrushTool(event)
        }
      }

      this.zwibblerCtx.on('draw', () => {
        if (this.showBrushPicker) {
          this.showBrushPicker = false
        }
      })
    },
    usePickTool(event) {
      this.zwibblerCtx.usePickTool()
      this.maybeFocusZwibbler(event)
    },
    usePanTool(event) {
      this.zwibblerCtx.usePanTool()
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_WHITEBOARD_PAN_TOOL, {
        sessionId: this.sessionId,
      })
      this.maybeFocusZwibbler(event)
    },
    useBrushTool(event) {
      this.zwibblerCtx.useBrushTool()
      this.maybeFocusZwibbler(event)
      this.lastSelectedBrushType = TOOLS.BRUSH
      this.lastSelectedBrushType = TOOLS.BRUSH
    },
    useThinBrushTool(event) {
      this.selectedThinBrushTool = true
      this.zwibblerCtx.useBrushTool({ lineWidth: 3 })
      this.maybeFocusZwibbler(event)
      this.lastSelectedBrushType = TOOLS.THIN_BRUSH
      this.lastSelectedBrushType = TOOLS.THIN_BRUSH
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
      this.lastSelectedTextSize = TOOLS.TEXT
      this.selectedSmallTextTool = false
      this.zwibblerCtx.useTextTool()
      this.maybeFocusZwibbler(event)
    },
    useSmallTextTool(event) {
      this.lastSelectedTextSize = TOOLS.SMALL_TEXT
      this.selectedSmallTextTool = true
      this.zwibblerCtx.useTextTool({ fontSize: 26, fontName: 'Arial' })
      this.maybeFocusZwibbler(event)
    },
    // TODO: Use a generic "toggle" method.
    toggleBrushes() {
      this.showBrushPicker = !this.showBrushPicker
      this.showShapePicker = false
      this.showTextPicker = false
      this.showColorPicker = false
      this.showMoreMenu = false
    },
    toggleShapes() {
      this.showShapePicker = !this.showShapePicker
      this.showBrushPicker = false
      this.showTextPicker = false
      this.showColorPicker = false
      this.showMoreMenu = false
    },
    toggleTextPicker() {
      this.showTextPicker = !this.showTextPicker
      this.showBrushPicker = false
      this.showShapePicker = false
      this.showColorPicker = false
      this.showMoreMenu = false
    },
    toggleColorPicker() {
      this.showColorPicker = !this.showColorPicker
      this.showBrushPicker = false
      this.showTextPicker = false
      this.showShapePicker = false
      this.showMoreMenu = false
      /* Since the eraser is also a `brush`, let's assume the user
       * doesn't want to erase in the color they just chose and
       * automatically switch to the brush.
       */
      if (this.selectedTool === 'eraser' && !this.showColorPicker) {
        this.useBrushTool()
      }
    },
    toggleMoreMenu() {
      this.showMoreMenu = !this.showMoreMenu
      this.showColorPicker = false
      this.showBrushPicker = false
      this.showTextPicker = false
      this.showShapePicker = false
    },
    undo() {
      this.zwibblerCtx.undo()
      this.hideHoveredToolbars()
    },
    redo() {
      this.zwibblerCtx.redo()
      this.hideHoveredToolbars()
    },
    clearWhiteboard() {
      this.zwibblerCtx.deleteNodes(this.zwibblerCtx.getAllNodes())
      this.resetCanvas()
      this.hideHoveredToolbars()
    },
    hideHoveredToolbars() {
      this.showBrushPicker = false
      this.showShapePicker = false
      this.showTextPicker = false
      this.showColorPicker = false
      this.showMoreMenu = false
    },
    openFileDialog(event) {
      AnalyticsService.captureEvent(
        EVENTS.IMAGE_UPLOAD_USER_CLICKED_UPLOAD_IMAGE,
        {
          tool: 'whiteboard',
        }
      )
      this.$refs.fileDialog.openFileDialog(event)
    },
    async showImageUploadError(timeMs) {
      this.uploadingPictureError = true
      this.imageUploadErrorMessage = 'Unable to upload image'
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
        const { isClean, failures } =
          await ModerationService.checkIfImageIsClean(formData)
        if (!isClean) {
          AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_IMAGE_CENSORED, {
            tool: 'whiteboard',
          })
          this.$store.commit('liveMedia/setModerationInfraction', {
            infraction: failures,
            source: 'image_upload',
            isBanned: false,
            occurredAt: new Date(),
          })
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
          AnalyticsService.captureEvent(
            EVENTS.IMAGE_UPLOAD_USER_UPLOADED_IMAGE,
            {
              tool: 'whiteboard',
            }
          )
        }
      } catch (error) {
        AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_FAILED, {
          tool: 'whiteboard',
        })
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
    goToRecentNodes() {
      if (!this.recentNodesOutsideView.length) return

      this.zoomToFit(null, this.recentNodesOutsideView)
      this.recentNodesOutsideView = []
      this.showGoToRecentNodesButton = false
      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_WHITEBOARD_GO_TO_LATEST,
        {
          sessionId: this.sessionId,
        }
      )
    },
    resetCanvas() {
      this.zwibblerCtx.setViewRectangle({
        x: 0,
        y: 0,
        width: this.canvasWidth,
        height: this.canvasHeight,
      })
      this.zwibblerCtx.setZoom(1)
    },
    zoomToFit(event, nodes) {
      if (event) {
        AnalyticsService.captureEvent(
          EVENTS.USER_CLICKED_WHITEBOARD_ZOOM_TO_FIT,
          {
            sessionId: this.sessionId,
          }
        )
        this.maybeFocusZwibbler(event)
      }

      nodes = nodes ?? this.zwibblerCtx.getAllNodes()
      if (!nodes.length) {
        this.resetCanvas()
        return
      }

      const bounds = this.zwibblerCtx.getBoundingRectangle(nodes)
      const minSize = 200
      // For small bounds, have a minimum width/height,
      // otherwise setViewRectangle will make the view
      // obnoxiously zoomed in.
      if (bounds.width < minSize && bounds.height < minSize) {
        this.zwibblerCtx.setViewRectangle({
          x: bounds.x,
          y: bounds.y,
          width: minSize,
          height: minSize,
        })
        this.zwibblerCtx.setZoom(2)
        return
      }

      this.zwibblerCtx.setViewRectangle({
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      })
    },
    zoomOut(event) {
      this.zwibblerCtx.zoomOut()
      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_WHITEBOARD_ZOOM_OUT_TOOL,
        {
          sessionId: this.sessionId,
        }
      )
      this.maybeFocusZwibbler(event)
    },
    zoomIn(event) {
      this.zwibblerCtx.zoomIn()
      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_WHITEBOARD_ZOOM_IN_TOOL,
        {
          sessionId: this.sessionId,
        }
      )
      this.maybeFocusZwibbler(event)
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

    async loadZwibbler() {
      const zwibblerCtx = window.Zwibbler.create('zwib-div', {
        allowZoom: false,
        autoPickTool: false,
        autoPickToolText: false,
        background: 'grid',
        collaborationServer: `${config.websocketRoot}/whiteboard/room/{name}`,
        confine: 'page',
        defaultBrushWidth: 5,
        defaultFontSize: 32,
        defaultSmoothness: 'sharpest',
        maximumZoom: 5,
        minimumZoom: 0.15,
        multilineText: true,
        showColourPanel: false,
        showToolbar: false,
        showHints: false,
        zoomOnResize: false,
      })

      this.zwibblerCtx = markRaw(zwibblerCtx)

      this.zwibblerCtx.on('set-keys', (keys) => {
        const cursor = this.$refs.partnerCursor
        const arrow = this.$refs.partnerArrow
        const zwibDiv = this.$refs.zwibDiv

        try {
          cursor.setAttribute('data-content', this.sessionPartner?.firstName)
          arrow.setAttribute('data-content', this.sessionPartner?.firstName)

          for (const key of keys) {
            if (key.name === 'isCursorOnCanvas' && !key.value) {
              cursor.style.visibility = 'hidden'
              arrow.style.visibility = 'hidden'
            } else if (key.name === 'cursorPosition') {
              const viewRect = this.zwibblerCtx.getViewRectangle()
              const whiteboardWidth = zwibDiv.clientWidth
              const whiteboardHeight = zwibDiv.clientHeight

              const scaleX = whiteboardWidth / viewRect.width
              const scaleY = whiteboardHeight / viewRect.height

              // Figure out where the partner's cursor is on our current view
              // of the whiteboard, adjusted for scale.
              const partnerCursorX = (key.value.x - viewRect.x) * scaleX
              const partnerCursorY = (key.value.y - viewRect.y) * scaleY

              const isPartnerCursorVisible =
                partnerCursorX >= 0 &&
                partnerCursorX <= whiteboardWidth &&
                partnerCursorY >= 0 &&
                partnerCursorY <= whiteboardHeight

              if (isPartnerCursorVisible) {
                arrow.style.visibility = 'hidden'

                cursor.style.left = partnerCursorX + 'px'
                cursor.style.top = partnerCursorY + 'px'
                cursor.style.visibility = 'visible'
              } else {
                cursor.style.visibility = 'hidden'

                const arrowPosition = this.calculateArrowPosition(
                  partnerCursorX,
                  partnerCursorY,
                  whiteboardWidth,
                  whiteboardHeight
                )
                arrow.style.left = arrowPosition.x + 'px'
                arrow.style.top = arrowPosition.y + 'px'
                arrow.style.transform = `rotate(${arrowPosition.angle}deg)`
                arrow.style.visibility = 'visible'
              }
            }
          }
        } catch (err) {
          LoggerService.noticeError(err)
          // If something goes wrong with the calculation, just hide the cursor and arrow.
          cursor.style.visibility = 'hidden'
          arrow.style.visibility = 'hidden'
        }
      })

      // Set up custom selection handles.
      this.setSelectionHandles()

      // Keep the canvas as read-only until connected.
      this.zwibblerCtx.setConfig('readOnly', true)
      this.zwibblerCtx.on('connected', () => {
        if (
          (this.isInfiniteWhiteboardEnabled && this.isStudent) ||
          this.zwibblerCtx.getDocumentProperty('useInfiniteWhiteboard')
        ) {
          AnalyticsService.captureEvent(EVENTS.USER_USING_INFINITE_WHITEBOARD, {
            sessionId: this.sessionId,
          })
          this.zwibblerCtx.setDocumentProperty('useInfiniteWhiteboard', true)
          this.useInfiniteWhiteboard = true
          this.zwibblerCtx.setConfig('allowZoom', true)
          this.zwibblerCtx.setConfig('scrollbars', false)
          this.zwibblerCtx.setConfig('wheelAdjustsBrush', 'down')
          this.zwibblerCtx.setConfig('rightButtonPans', true)
          this.zoomToFit()
          this.addInfiniteSizeListeners()
        } else {
          this.useInfiniteWhiteboard = false
          this.zwibblerCtx.setConfig('allowZoom', false)
          this.zwibblerCtx.setConfig('scrollbars', true)
          this.zwibblerCtx.setConfig('wheelAdjustsBrush', 'none')
          this.zwibblerCtx.setPaperSize(this.canvasWidth, this.canvasHeight)
          this.resizeViewRectangle()
          this.addFixedSizeListeners()
        }

        LoggerService.log('Zwibbler: Connected', {
          sessionId: this.sessionId,
        })
        AnalyticsService.captureEvent(EVENTS.ZWIBBLER_CONNECTED, {
          sessionId: this.sessionId,
        })
        this.isConnected = true
        this.hasConnectionFailure = false
        this.zwibblerCtx.setConfig('readOnly', false)

        // TODO: _Is_ there a way to access the WS connection in a less sketchy way?
        // The Zwibbler WS connection is on different properties depending on the build you are using.
        // In order, try:
        // - public/static/zwibbler-demo.js
        // - (CDN) march2024/zwibbler2.js
        // - (CDN) june2021/zwibbler2.js
        const zwibblerWsConnection =
          this.zwibblerCtx?.zc?.Pb?.Pb ??
          this.zwibblerCtx?.kc?.Ac?.Ac ??
          this.zwibblerCtx?.Ec?.rc?.rc
        const zwibblerOnMessage = zwibblerWsConnection.onmessage
        const zwibblerOnClose = zwibblerWsConnection.onclose

        // Intercept Zwibbler's websocket message handler
        zwibblerWsConnection.onmessage = (messageEvent) => {
          // Forward message to Zwibbler unless it's our "pong" response
          if (messageEvent.data !== 'p0ng') zwibblerOnMessage(messageEvent)
        }

        // Intercept Zwibbler's websocket close handler to throw custom error
        zwibblerWsConnection.onclose = (closeEvent) => {
          // The onclose callback is called _after_ calling `onDestroy`,
          // which we do before unmount of the component. If there is
          // no Zwibbler ctx, it means we are simply leaving the component.
          if (this.zwibblerCtx) {
            LoggerService.noticeError(
              'Zwibbler: Unexpectedly closing WS connection',
              {
                sessionId: this.sessionId,
                userType: this.userType,
              }
            )
          }

          zwibblerOnClose(closeEvent)
        }

        // Ping server every 45 seconds to keep the connection open.
        this.pingPongInterval = window.setInterval(() => {
          zwibblerWsConnection.send('p1ng')
        }, 45 * 1000)

        // Set brush tool to default tool.
        this.useBrushTool()

        // Don't start setting selected tool until connected
        this.zwibblerCtx.on('tool-changed', (toolname) => {
          // The eraser uses the brush tool. In order to make it seem as the eraser
          // is active for the user, we're overriding the selectedTool to be
          // `eraser` instead of `brush`
          if (this.selectedEraserTool) {
            this.selectedEraserTool = false
            this.selectedTool = 'eraser'
            this.hideHoveredToolbars()
            this.hideHoveredToolbars()
          } else if (this.selectedThinBrushTool) {
            this.selectedThinBrushTool = false
            this.selectedTool = TOOLS.THIN_BRUSH
            this.selectedTool = TOOLS.THIN_BRUSH
          } else if (this.selectedSmallTextTool) {
            this.selectedSmallTextTool = false
            this.selectedTool = 'small-text'
            this.hideHoveredToolbars()
            this.hideHoveredToolbars()
          } else {
            this.selectedTool = toolname
          }
        })

        this.zwibblerCtx.on('document-changed', (info) => {
          const isRemoteChange = info && info.remote
          if (
            this.isVolunteer &&
            isRemoteChange &&
            this.zwibblerCtx.getDocumentProperty('useInfiniteWhiteboard') &&
            !this.useInfiniteWhiteboard
          ) {
            AnalyticsService.captureEvent(
              EVENTS.USER_USING_INFINITE_WHITEBOARD,
              {
                sessionId: this.sessionId,
              }
            )
            this.useInfiniteWhiteboard = true
            this.addInfiniteSizeListeners()
            this.removeFixedSizeListeners()
            setTimeout(() => {
              this.zwibblerCtx.setDocumentSize(null, null)
              this.zwibblerCtx.setConfig('allowZoom', true)
              this.zwibblerCtx.setConfig('wheelAdjustsBrush', 'down')
              this.zwibblerCtx.setConfig('rightButtonPans', true)
              this.zoomToFit()
            }, 500)
          }

          const isWhiteboardHidden = this.mobileMode && !this.isWhiteboardOpen
          const shouldResizeView = isRemoteChange && isWhiteboardHidden
          /**
           * If mobile user is viewing chat when new whiteboard changes are made,
           * resize the view so they can see everything on the whiteboard.
           * TODO: Decide if this is actually the behaviour we want. The user
           * will be able to see that there are additional changes on the whiteboard
           * because of the scrollbars - it might actually be more annoying that you lose
           * where you were focused/zoomed into.
           */
          if (shouldResizeView) {
            setTimeout(() => {
              this.zoomToFit()
            }, 500)
          }
        })
      })

      this.zwibblerCtx.on('nodes-added', (nodes) => {
        if (!this.initialNodesLoaded) {
          this.initialNodesLoaded = true
          return
        }

        this.checkIfNodesAreOutsideView(nodes)
      })

      this.zwibblerCtx.on('nodes-removed', () => {
        if (this.zwibblerCtx.getAllNodes().length === 0) {
          this.resetCanvas()
        }
      })

      this.zwibblerCtx.on('connect-error', () => {
        this.isConnected = false
        this.hadConnectionIssue = true
        window.clearInterval(this.pingPongInterval)
        this.zwibblerCtx.setConfig('readOnly', true)
        LoggerService.noticeError('Zwibbler: Received connect-error.', {
          sessionId: this.sessionId,
        })
        AnalyticsService.captureEvent(EVENTS.ZWIBBLER_CONNECT_ERROR, {
          sessionId: this.sessionId,
        })
      })

      // disallow dragging and pasting to the whiteboard
      this.zwibblerCtx.on('paste', () => {
        return false
      })

      try {
        await this.joinSharedSessionWithRetry()
      } catch (err) {
        LoggerService.noticeError(err)
      }
    },

    async joinSharedSessionWithRetry() {
      const MAX_RETRIES = 5
      const TIMEOUT_MS = 5000
      let currentAttempt = 1

      try {
        await backOff(
          () => {
            return new Promise((resolve, reject) => {
              const timeoutId = setTimeout(() => {
                this.zwibblerCtx.leaveSharedSession(this.sessionId)
                reject(new Error())
              }, TIMEOUT_MS)

              this.zwibblerCtx
                .joinSharedSession(this.sessionId, true)
                .then(() => {
                  LoggerService.log(
                    `Zwibbler: Successfully connected to collaboration server on attempt ${currentAttempt}.`,
                    {
                      sessionId: this.sessionId,
                      attemptNumber: currentAttempt,
                    }
                  )
                  AnalyticsService.captureEvent(EVENTS.ZWIBBLER_CONNECTED, {
                    sessionId: this.sessionId,
                    attemptNumber: currentAttempt,
                  })
                  clearTimeout(timeoutId)
                  resolve()
                })
                .catch((error) => {
                  clearTimeout(timeoutId)
                  reject(error)
                })
            })
          },
          {
            numOfAttempts: MAX_RETRIES,
            retry: (_error, attemptNumber) => {
              currentAttempt = attemptNumber + 1
              LoggerService.log(
                `Zwibbler: Failed to connect to collaboration server on attempt ${attemptNumber}`,
                {
                  sessionId: this.sessionId,
                  attemptNumber,
                }
              )
              AnalyticsService.captureEvent(EVENTS.ZWIBBLER_FAILED_TO_CONNECT, {
                sessionId: this.sessionId,
                attemptNumber,
              })
              return true
            },
          }
        )
      } catch {
        this.hasConnectionFailure = true
        LoggerService.noticeError(
          `Zwibbler: Failed to connect to collaboration server after ${MAX_RETRIES} retries.`,
          {
            sessionId: this.sessionId,
            retries: MAX_RETRIES,
            timeout: TIMEOUT_MS,
          }
        )
        AnalyticsService.captureEvent(EVENTS.ZWIBBLER_FAILED_TO_CONNECT, {
          sessionId: this.sessionId,
          attemptNumber: MAX_RETRIES,
          isFinal: true,
        })
      }
    },

    checkIfNodesAreOutsideView(newNodes) {
      if (!newNodes.length) return

      const nodeBounds = this.zwibblerCtx.getBoundingRectangle(newNodes)
      if (!nodeBounds) return

      // Skip small nodes to prevent going to nodes that were unintentionally
      // added while navigating the whiteboard.
      // 50x50 just seemed like a reasonable size to prevent navigating to
      // accidental dots or small dashes, but we might need to play around with
      // these measurements.
      if (nodeBounds.width < 50 && nodeBounds.height < 50) return

      // This is unfortunately a bit of a hack until we update our Zwibbler version,
      // because `remote` isn't an arg in the `nodes-added` callback. Instead, we
      // check if the nodes added are outside of the view. If they are, we know
      // that we couldn't have added them.
      const currentView = this.zwibblerCtx.getViewRectangle()
      const isOutsideView =
        nodeBounds.x < currentView.x ||
        nodeBounds.y < currentView.y ||
        nodeBounds.x + nodeBounds.width > currentView.x + currentView.width ||
        nodeBounds.y + nodeBounds.height > currentView.y + currentView.height

      if (isOutsideView) {
        this.showGoToRecentNodesButton = true
        this.recentNodesOutsideView =
          this.recentNodesOutsideView.concat(newNodes)
      }
    },

    calculateArrowPosition(x, y, whiteboardWidth, whiteboardHeight) {
      // Boundaries of the whiteboard (within which we can place the arrow).
      // Leave additional space so as the arrow rotates, it doesn't get hidden off-screen.
      const margin = 5
      const bounds = {
        left: margin,
        right: whiteboardWidth - margin,
        top: margin,
        bottom: whiteboardHeight - margin,
      }

      // Determine the distance (and direction) from the center to the cursor.
      // Positive means the partner's cursor is to the right (x) or bottom (y).
      // Negative means the partner's cursor is to the left (x) or top (y).
      const centerX = whiteboardWidth / 2
      const centerY = whiteboardHeight / 2
      const distX = x - centerX
      const distY = y - centerY

      // Determine distance to horizontal edge.
      const horizontalDist =
        distX > 0
          ? (bounds.right - centerX) / distX
          : (bounds.left - centerX) / distX

      // Determine distance to vertical edge.
      const verticalDist =
        distY > 0
          ? (bounds.bottom - centerY) / distY
          : (bounds.top - centerY) / distY

      let edgeX, edgeY
      // On a straight line from the center of the whiteboard to the partner's
      // cursor, determine which edge (horizontal i.e. left/right or vertical i.e. top/bottom)
      // of the whiteboard would intersect first.
      if (Math.abs(horizontalDist) < Math.abs(verticalDist)) {
        // If a horizontal edge would intersect first, edgeX is just either the left or right.
        edgeX = distX > 0 ? bounds.right : bounds.left
        edgeY = centerY + distY * horizontalDist
        // Account for edge cases at the corners to make sure the arrow stays in bounds.
        edgeY = Math.max(bounds.top, Math.min(bounds.bottom, edgeY))
      } else {
        // If a vertical edge would intersect first, edgeX is just either the top or bottom.
        edgeY = distY > 0 ? bounds.bottom : bounds.top
        edgeX = centerX + distX * verticalDist
        // Account for edge cases at the corners to make sure the arrow stays in bounds.
        edgeX = Math.max(bounds.left, Math.min(bounds.right, edgeX))
      }

      return {
        x: edgeX,
        y: edgeY,
        angle: Math.atan2(distY, distX) * (180 / Math.PI),
      }
    },
  },
  async beforeUnmount() {
    this.removeFixedSizeListeners()
    this.removeInfiniteSizeListeners()
    window.clearInterval(this.pingPongInterval)
    // Zwibbler cleanup.
    // This method doesn't exist in zwibbler-demo.js
    if (this.zwibblerCtx?.leaveSharedSession) {
      this.zwibblerCtx.leaveSharedSession()
    }
    this.zwibblerCtx.destroy()
    this.zwibblerCtx = null
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
          case TOOLS.BRUSH:
            this.useBrushTool()
            break
          case TOOLS.THIN_BRUSH:
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
          case TOOLS.TEXT:
            this.useTextTool()
            break
          case TOOLS.SMALL_TEXT:
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

.zoom-toolbar {
  background-color: rgb(238, 238, 238);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  position: absolute;
  right: 10px;
  top: 10px;
  width: 50px;
}

.toolbar {
  align-items: center;
  background-color: rgb(238, 238, 238);
  border-radius: 8px;
  bottom: 20px;
  display: flex;
  height: 50px;
  justify-content: space-around;
  left: 0;
  margin: auto;
  position: absolute;
  right: 0;
  width: 100%;

  @include breakpoint-above('small') {
    height: 70px;
    max-width: 550px;
  }
}

.toolbar-item {
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  max-width: 70px;
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;

  @include breakpoint-below('tiny') {
    padding: 0;
  }

  &:last-child {
    border-radius: 0 8px 8px 0;
  }

  &:first-child {
    border-radius: 8px 0 0 8px;
  }

  &:hover {
    cursor: pointer;
  }

  &:not(.selected-tool):hover {
    background: #e2e2e2;
  }

  .option-item {
    border-radius: initial;
    height: 40px;
    padding: 0.5em;
  }

  &[disabled] {
    cursor: auto;
    &:not(.selected-tool):hover {
      background: transparent;
    }
  }
}

.zoom-toolbar {
  .toolbar-item {
    height: 40px;

    .toolbar-icon {
      &.rotate-up {
        rotate: 270deg;
      }

      &.rotate-down {
        rotate: 90deg;
      }
    }

    &:first-child {
      border-radius: 8px 8px 0 0;
    }

    &:last-child {
      border-radius: 0 0 8px 8px;
    }

    &.go-to-action {
      animation: pulse-background 3s infinite;

      .toolbar-icon {
        height: 30px;
        width: 30px;
      }

      @keyframes pulse-background {
        0% {
          background-color: transparent;
        }
        50% {
          background-color: lighten($c-information-blue, 45%);
        }
        100% {
          background-color: transparent;
        }
      }
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
  bottom: 45px;
  margin: 0;
  position: absolute;

  &.--color {
    padding: 10px 8px;
  }

  &.--more-menu {
    right: 2px;
  }

  @include breakpoint-above('small') {
    bottom: 58px;
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
  z-index: 10;
  transition: all 0.15s ease-in;

  &--connection {
    background-color: rgba(110, 140, 171, 0.87);
  }

  &--failure {
    background-color: $c-shadow-warn;
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

.eye-icon {
  color: $c-error-red;
}

#partner-cursor {
  background-color: $c-information-blue;
  border-radius: 50%;
  height: 10px;
  position: absolute;
  width: 10px;

  &:before {
    content: attr(data-content);
    position: absolute;
    top: -25px;
  }
}

#partner-arrow {
  position: absolute;

  &:before {
    border-bottom: 20px solid transparent;
    border-left: 20px solid $c-information-blue;
    border-top: 20px solid transparent;
    content: '';
    position: absolute;
    right: 0;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  &:after {
    content: attr(data-content);
    position: absolute;
    right: 6px;
    top: -100%;
    bottom: 50%;
    transform: rotate(90deg);
  }
}
</style>
