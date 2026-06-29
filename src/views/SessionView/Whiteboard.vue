<template>
  <div class="zwib-wrapper" :class="toolClass">
    <transition name="whiteboard-warning">
      <div
        v-if="!loadingText && !isConnected && !isSessionOver"
        class="whiteboard-warning whiteboard-warning--failure"
      >
        Failed to connect to the whiteboard. Please refresh your page.
      </div>
      <loading-message
        :message="loadingText"
        class="whiteboard-warning whiteboard-warning--connection"
        v-else-if="loadingText"
      />
    </transition>
    <div
      id="zwib-div"
      ref="zwibDiv"
      :class="{ 'whiteboard-open': isWhiteboardOpen }"
    ></div>
    <div id="partner-cursor" ref="partnerCursor"></div>
    <div id="toolbar" class="toolbar">
      <div class="toolbar-item" tabindex="0">
        <ScreenShareToolbarButton
          :hasMeetingEnded="!meetingHasNotEnded"
          :onClick="toggleScreenShareWindow"
          tooltipPosition="right"
          :isViewingPartnerScreenShare="isViewingPartnerScreenShare"
          :isScreenSharing="isScreenSharing"
          :isLoading="isLoadingScreenShareControl"
          :spinnerSizing="{ height: 30, width: 30 }"
          :isError="unableToJoinMediaRoom"
          :isLiveMediaBanned="isBanned"
        />
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
        type="button"
        class="toolbar-item"
        title="Pick tool"
        v-bind:class="selectedTool === 'pick' ? 'selected-tool' : ''"
        tabindex="0"
        @click="togglePickTool"
        @keydown.enter="togglePickTool"
        :disabled="!isConnected"
      >
        <PickToolIcon class="toolbar-icon--pick" />
      </button>
      <button
        type="button"
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
            @click.stop="useBrushTool"
            @keydown.enter="useBrushTool"
          >
            <ThickPenIcon class="toolbar-icon" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'thin-brush' ? 'selected-tool' : ''"
            tabindex="0"
            @click.stop="useThinBrushTool"
            @keydown.enter="useThinBrushTool"
          >
            <ThinPenIcon class="toolbar-icon" />
          </div>
        </div>
      </button>
      <button
        type="button"
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
        type="button"
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
          accept="image/png, image/jpeg, image/webp, image/heic"
          @file-selected="uploadPhoto"
          @file-too-large="onFileTooLarge"
          :maxFileSizeBytes="MAX_IMAGE_FILE_SIZE_BYTES"
          :disabled="loadingText"
        />
        <PhotoUploadIcon class="toolbar-icon--photo" />
      </button>
      <button
        type="button"
        class="toolbar-item"
        title="Shapes"
        tabindex="0"
        @click.stop="toggleShapes"
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
            @click.stop="useLineTool"
            @keydown.enter="useLineTool"
          >
            <line-icon class="toolbar-icon--shape" title="Line tool" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'arrow' ? 'selected-tool' : ''"
            tabindex="0"
            @click.stop="useArrowTool"
            @keydown.enter="useArrowTool"
          >
            <arrow-icon class="toolbar-icon--shape" title="Arrow tool" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'circle' ? 'selected-tool' : ''"
            tabindex="0"
            @click.stop="useCircleTool"
            @keydown.enter="useCircleTool"
          >
            <circle-icon class="toolbar-icon--shape" title="Circle tool" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'polygon' ? 'selected-tool' : ''"
            tabindex="0"
            @click.stop="useTriangleTool"
            @keydown.enter="useTriangleTool"
          >
            <triangle-icon class="toolbar-icon--shape" title="Triangle tool" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'rectangle' ? 'selected-tool' : ''"
            tabindex="0"
            @click.stop="useRectangleTool"
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
        type="button"
        class="toolbar-item"
        title="Text"
        tabindex="0"
        @click="clickTextPicker"
        @keydown.enter="clickTextPicker"
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
            @click.stop="useTextTool"
            @keydown.enter="useTextTool"
          >
            <TextIcon class="toolbar-icon" />
          </div>
          <div
            class="toolbar-item option-item"
            :class="selectedTool === 'small-text' ? 'selected-tool' : ''"
            title="Small Text"
            tabindex="0"
            @click.stop="useSmallTextTool"
            @keydown.enter="useSmallTextTool"
          >
            <SmallTextIcon class="toolbar-icon" />
          </div>
        </div>
      </button>
      <button
        type="button"
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
        type="button"
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
  </div>
</template>

<script>
import { socket } from '@/socket'
import { mapGetters } from 'vuex'
import { markRaw } from 'vue'
import { backOff } from 'exponential-backoff'
import { toastController } from '@ionic/vue'
import { closeCircleOutline } from 'ionicons/icons'
import PickToolIcon from '@/assets/whiteboard_icons/selection.svg'
import MoreIcon from '@/assets/VerticalMenuButtons.svg'
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
import FileDialog from '@/components/FileDialog.vue'
import ShapesIcon from '@/assets/whiteboard_icons/shapes.svg'
import ArrowIcon from '@/assets/arrow.svg'
import CircleIcon from '@/assets/whiteboard_icons/circle.svg'
import RectangleIcon from '@/assets/whiteboard_icons/rectangle.svg'
import TriangleIcon from '@/assets/whiteboard_icons/triangle.svg'
import LineIcon from '@/assets/whiteboard_icons/line.svg'
import EraserIcon from '@/assets/whiteboard_icons/eraser.svg'
import TextIcon from '@/assets/whiteboard_icons/text_tool.svg'
import SmallTextIcon from '@/assets/whiteboard_icons/small_text_tool.svg'
import LoadingMessage from '@/components/LoadingMessage.vue'
import config from '../../config'
import LoggerService from '@/services/LoggerService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import ModerationService from '@/services/ModerationService'
import { WhiteboardNullTool } from './WhiteboardNullTool'
import WhiteboardAiTutorButton from './WhiteboardAiTutorButton.vue'
import SessionService from '@/services/SessionService'
import { processImage, getImageTooLargeMessage } from '@/utils/image-pipeline'
import { BYTES_PER_MEGABYTE } from '@/utils/bytes'
import { secondsInMs } from '@/utils/time-utils'
import {
  PARTNER_IMAGE_UPLOAD_STATUS,
  IMAGE_UPLOAD_EVENTS,
  getPartnerUploadingMsg,
  IMAGE_UPLOADING_STATE_MESSAGES,
  getPartnerUploadFailedMsg,
} from '@/composables/imageUploadState'
import ScreenShareToolbarButton from '@/components/ScreenShareToolbarButton.vue'

const CENSORED_CONTENT_PLACEHOLDER = 'CONTENT CENSORED'

const TOOLS = {
  BRUSH: 'brush',
  THIN_BRUSH: 'thin-brush',
  TEXT: 'text',
  SMALL_TEXT: 'small-text',
}

export default {
  components: {
    ScreenShareToolbarButton,
    WhiteboardAiTutorButton,
    PickToolIcon,
    MoreIcon,
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
    EraserIcon,
    TextIcon,
    SmallTextIcon,
    LoadingMessage,
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
    meetingHasNotEnded: {
      type: Boolean,
      required: true,
    },
    isViewingPartnerScreenShare: {
      type: Boolean,
      required: true,
    },
    isLoadingScreenShareControl: {
      type: Boolean,
      required: true,
    },
    unableToJoinMediaRoom: {
      type: Boolean,
      required: true,
    },
    isZwibserveSession: {
      type: Boolean,
      default: false,
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
      loadingText: 'Attempting to connect the whiteboard',
      isConnected: false,
      pingPongInterval: null,
      uploadingImageTimeout: null,
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
      lastSelectedShapeType: 'line',
      // Debounce sending cursor position.
      lastCursorBroadcastAt: 0,
    }
  },
  emits: ['toggleAiWidget', 'clickedShareScreen'],
  watch: {
    selectedTool(newTool) {
      if (newTool) {
        AnalyticsService.captureEvent(EVENTS.WHITEBOARD_TOOL_SELECTED, {
          tool: newTool,
          sessionId: this.sessionId,
        })
      }
    },
  },
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      userType: 'user/userType',
      isStudent: 'user/isStudent',
      isVolunteer: 'user/isVolunteer',
      sessionPartner: 'user/sessionPartner',
      isBanned: 'user/banType',
      partnerImageUploadError: 'socket/partnerImageUploadError',
      partnerImageUploadStatus: 'socket/partnerImageUploadStatus',
    }),
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
    MAX_IMAGE_FILE_SIZE_BYTES() {
      return BYTES_PER_MEGABYTE * 10
    },
  },
  async mounted() {
    this.loadZwibbler()
  },
  methods: {
    async maybeHandleTextNodeInfraction(nodeIds) {
      const moderationResults = await this.moderateTextNodes(nodeIds)
      const failures = moderationResults.filter((result) => !!result)

      if (failures.length) {
        this.$store.commit('liveMedia/setModerationInfraction', {
          infraction: Object.keys(failures[0]),
          source: 'whiteboard_text_node',
          isBanned: false,
          occurredAt: new Date(),
        })
      }
    },
    async moderateTextNodes(nodeIds) {
      const nodes = nodeIds.map((id) => this.zwibblerCtx.getNodeObject(id))
      const textNodes = nodes.filter((node) => node.type === 'TextNode')
      return await Promise.all(
        textNodes.map((node) => this.moderateTextNode(node))
      )
    },
    async moderateTextNode(node) {
      const censorNode = (node) => {
        this.zwibblerCtx.setNodeProperty(
          node.id,
          'text',
          CENSORED_CONTENT_PLACEHOLDER
        )
      }
      try {
        const nodeText = node?.props?.text
        if (nodeText === CENSORED_CONTENT_PLACEHOLDER)
          // otherwise, we'll re-moderate everything on load.
          return
        if (!nodeText) {
          throw new Error('Could not extract text from node')
        }
        const { failures } = await ModerationService.checkIfMessageIsClean({
          message: nodeText,
          sessionId: this.sessionId,
          source: 'whiteboard-text-node',
        })
        const isClean = Object.keys(failures).length === 0
        if (!isClean) {
          censorNode(node)
          return failures
        }
      } catch (err) {
        LoggerService.noticeError(
          err,
          'Failed to moderate text node on Zwibbler'
        )
        censorNode(node)
      }
    },
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
    toggleScreenShareWindow() {
      AnalyticsService.captureEvent(
        EVENTS.SCREENSHARE_USER_CLICKED_SCREENSHARE_BUTTON,
        {
          tool: 'whiteboard',
          userType: this.userType,
          isZwibserveSession: this.isZwibserveSession,
        }
      )
      this.usePickTool()
      this.$emit('clickedShareScreen')
    },
    isMobile() {
      return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    },
    resizeViewRectangle() {
      this.zwibblerCtx.setZoom('width')
    },
    moveMouseEvent(event) {
      const now = Date.now()
      if (now - this.lastCursorBroadcastAt < 100) return
      this.lastCursorBroadcastAt = now

      // Get the x,y coordinates of the cursor within the _Zwibbler_ canvas,
      // instead of the coordinates of the mouse on the HTML window.
      const point = this.zwibblerCtx.getDocumentCoordinates(
        event.pageX,
        event.pageY
      )
      const scale = this.zwibblerCtx.getCanvasScale()
      this.setSessionKey(
        'cursorPosition',
        {
          x: point.x,
          y: point.y,
          scale,
        },
        false
      )
    },
    handlePointerLeave() {
      this.setSessionKey('isCursorOnCanvas', false, false)
    },
    handlePointerEnter() {
      this.setSessionKey('isCursorOnCanvas', false, false)
    },
    setSessionKey(key, value, persist) {
      this.zwibblerCtx.setSessionKey(key, value, persist)
    },
    addListeners() {
      window.addEventListener('orientationchange', this.handleOrientationChange)
      window.addEventListener('resize', this.handleWindowResize)

      const zwibDiv = this.$refs.zwibDiv
      zwibDiv.addEventListener('pointermove', this.moveMouseEvent)
      zwibDiv.addEventListener('pointerleave', this.handlePointerLeave)
      zwibDiv.addEventListener('pointerenter', this.handlePointerEnter)
    },
    removeListeners() {
      window.removeEventListener(
        'orientationchange',
        this.handleOrientationChange
      )
      window.removeEventListener('resize', this.handleWindowResize)

      const zwibDiv = this.$refs.zwibDiv
      zwibDiv.removeEventListener('pointermove', this.moveMouseEvent)
      zwibDiv.removeEventListener('pointerleave', this.handlePointerLeave)
      zwibDiv.removeEventListener('pointerenter', this.handlePointerEnter)
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
    clickBrushTool() {
      this.toggleBrushes()
      if (
        !this.lastSelectedBrushType ||
        this.lastSelectedBrushType === TOOLS.BRUSH
      ) {
        this.useBrushTool()
      } else if (this.lastSelectedBrushType === TOOLS.THIN_BRUSH) {
        this.useThinBrushTool()
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
        !this.lastSelectedTextSize ||
        this.lastSelectedTextSize === TOOLS.TEXT
      ) {
        this.useTextTool()
      } else if (this.lastSelectedTextSize === TOOLS.SMALL_TEXT) {
        this.useSmallTextTool()
      }

      this.zwibblerCtx.on('edit-text-shown', () => {
        if (this.showTextPicker) {
          this.showTextPicker = false
        }
      })
    },
    usePickTool(event) {
      this.selectedTool = 'pick'
      this.zwibblerCtx.usePickTool()
      this.maybeFocusZwibbler(event)
    },
    usePanTool(event) {
      this.zwibblerCtx.usePanTool()
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_WHITEBOARD_PAN_TOOL, {
        sessionId: this.sessionId,
        isZwibserveSession: this.isZwibserveSession,
      })
      this.maybeFocusZwibbler(event)
    },
    useBrushTool() {
      this.zwibblerCtx.useBrushTool()
      this.selectedTool = TOOLS.BRUSH
      this.lastSelectedBrushType = TOOLS.BRUSH
    },
    useThinBrushTool() {
      this.selectedThinBrushTool = true
      this.zwibblerCtx.useBrushTool({ lineWidth: 3 })
      this.selectedTool = TOOLS.THIN_BRUSH
      this.lastSelectedBrushType = TOOLS.THIN_BRUSH
    },
    useEraserTool(event) {
      this.selectedTool = 'eraser'
      this.hideHoveredToolbars()
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
      this.selectedTool = 'line'
      this.zwibblerCtx.useLineTool(
        {},
        {
          singleLine: true,
        }
      )
      this.maybeFocusZwibbler(event)
    },
    useArrowTool(event) {
      this.selectedTool = 'arrow'
      this.zwibblerCtx.useArrowTool()
      this.maybeFocusZwibbler(event)
    },
    useCircleTool(event) {
      this.selectedTool = 'circle'
      this.zwibblerCtx.useCircleTool()
      this.maybeFocusZwibbler(event)
    },
    useTriangleTool(event) {
      this.selectedTool = 'polygon'
      this.zwibblerCtx.usePolygonTool(3, 0)
      this.maybeFocusZwibbler(event)
    },
    useRectangleTool(event) {
      this.selectedTool = 'rectangle'
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
    useTextTool() {
      this.lastSelectedTextSize = TOOLS.TEXT
      this.selectedSmallTextTool = false
      this.zwibblerCtx.useTextTool()
      this.selectedTool = TOOLS.TEXT
    },
    useSmallTextTool() {
      this.lastSelectedTextSize = TOOLS.SMALL_TEXT
      this.selectedSmallTextTool = true
      this.zwibblerCtx.useTextTool({ fontSize: 20, fontName: 'Arial' })
      this.selectedTool = TOOLS.SMALL_TEXT
    },
    // TODO: Use a generic "toggle" method.
    toggleBrushes() {
      this.showBrushPicker = !this.showBrushPicker
      this.showShapePicker = false
      this.showTextPicker = false
      this.showColorPicker = false
      this.showMoreMenu = false
    },
    togglePickTool(event) {
      this.usePickTool(event)
      this.showBrushPicker = false
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
    async uploadPhoto(uploadEvents) {
      let file = uploadEvents.files[0]

      if (!this.isWhiteboardOpen && this.mobileMode) this.toggleWhiteboard()

      this.usePickTool(uploadEvents.dialogOpeningEvent)

      this.loadingText =
        IMAGE_UPLOADING_STATE_MESSAGES.SENDER[
          IMAGE_UPLOAD_EVENTS.MODERATING_IMAGE
        ]

      socket.emit('moderatingImage', {
        sessionId: this.sessionId,
      })

      try {
        file = await processImage(file)

        // Moderate the image
        const formData = new FormData()
        formData.append('image', file)
        formData.append('sessionId', this.sessionId)
        const { isClean, failures } =
          await ModerationService.checkIfImageIsClean(formData)
        if (!isClean) {
          socket.emit('imageUploadFailed', {
            sessionId: this.sessionId,
            moderationFailures: failures,
          })
          this.handleImageFailedModeration(failures)
          return
        }

        const imageUrl = await SessionService.uploadSessionImage(
          this.sessionId,
          file
        )
        this.insertPhoto(imageUrl)
        socket.emit('imageUploadSuccess', {
          sessionId: this.sessionId,
        })
        AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_USER_UPLOADED_IMAGE, {
          tool: 'whiteboard',
        })
      } catch (error) {
        socket.emit('imageUploadFailed', {
          sessionId: this.sessionId,
          uploadError: true,
        })
        AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_FAILED, {
          tool: 'whiteboard',
        })
        this.showErrorToast(
          IMAGE_UPLOADING_STATE_MESSAGES.SENDER[
            IMAGE_UPLOAD_EVENTS.IMAGE_UPLOAD_FAILED
          ]
        )
        LoggerService.noticeError(error, {
          sessionId: this.sessionId,
          isZwibserveSession: this.isZwibserveSession,
        })
        return
      } finally {
        // Reset the file input
        uploadEvents.fileSelectionEvent.target.value = ''
        this.loadingText = null
        this.clearUploadImageTimeout()
      }
    },
    onFileTooLarge() {
      this.showErrorToast(
        getImageTooLargeMessage(this.MAX_IMAGE_FILE_SIZE_BYTES)
      )
    },
    insertPhoto(imageUrl) {
      this.uploadingImageNodeId = this.zwibblerCtx.createNode('ImageNode', {
        url: imageUrl,
        opacity: 0,
      })
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
      const collabRoot = this.isZwibserveSession
        ? `${config.websocketRoot}/graffiti`
        : config.websocketRoot
      const zwibblerCtx = window.Zwibbler.create('zwib-div', {
        allowZoom: true,
        autoPickTool: false,
        autoPickToolText: false,
        background: 'grid',
        collaborationServer: `${collabRoot}/whiteboard/room/{name}`,
        confine: 'page',
        clipToPage: true,
        defaultBrushWidth: 5,
        defaultFontSize: 32,
        defaultSmoothness: 'sharpest',
        maximumZoom: 2.5,
        minimumZoom: 0.5,
        multilineText: true,
        outsidePageColour: '#f5f5f5',
        pageBorderColour: '#ccc',
        pageShadow: false,
        pageView: true,
        scrollbars: true,
        showColourPanel: false,
        showToolbar: false,
        showHints: false,
        wheelAdjustsBrush: 'none',
        zoomOnResize: false,
      })

      this.zwibblerCtx = markRaw(zwibblerCtx)
      await this.$store.dispatch('session/setZwibbler', this.zwibblerCtx)
      this.zwibblerCtx.setPaperSize(this.canvasWidth, this.canvasHeight)
      this.resizeViewRectangle()
      this.addListeners()

      this.zwibblerCtx.on('set-keys', (keys) => {
        const cursor = this.$refs.partnerCursor
        const zwibDiv = this.$refs.zwibDiv

        try {
          cursor.setAttribute('data-content', this.sessionPartner?.firstName)

          for (const key of keys) {
            if (key.name === 'isCursorOnCanvas' && !key.value) {
              cursor.style.visibility = 'hidden'
            } else if (key.name === 'cursorPosition') {
              const whiteboardWidth = zwibDiv.clientWidth
              const whiteboardHeight = zwibDiv.clientHeight

              const viewRect = this.zwibblerCtx.getViewRectangle()
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
                cursor.style.left = partnerCursorX + 'px'
                cursor.style.top = partnerCursorY + 'px'
                cursor.style.visibility = 'visible'
              } else {
                cursor.style.visibility = 'hidden'
              }
            }
          }
        } catch (err) {
          LoggerService.noticeError(err, {
            sessionId: this.sessionId,
            isZwibserveSession: this.isZwibserveSession,
          })
          // If something goes wrong with the calculation, just hide the cursor.
          cursor.style.visibility = 'hidden'
        }
      })

      // Set up custom selection handles.
      this.setSelectionHandles()

      // Keep the canvas as read-only until connected.
      this.zwibblerCtx.setConfig('readOnly', true)
      this.zwibblerCtx.on('connected', () => {
        this.isConnected = true
        this.loadingText = null
        this.resizeViewRectangle()
        this.zwibblerCtx.setConfig('readOnly', false)

        LoggerService.log('Zwibbler: Connected', {
          sessionId: this.sessionId,
          isZwibserveSession: this.isZwibserveSession,
        })
        AnalyticsService.captureEvent(EVENTS.ZWIBBLER_CONNECTED, {
          sessionId: this.sessionId,
          isZwibserveSession: this.isZwibserveSession,
        })
        // TODO: _Is_ there a way to access the WS connection in a less sketchy way?
        // The Zwibbler WS connection is on different properties depending on the build you are using.
        // In order, try:
        // - public/static/zwibbler-demo.js
        // - (CDN) march2024/zwibbler2.js
        // - (CDN) june2021/zwibbler2.js
        if (!this.isZwibserveSession) {
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
              // TODO: This isn't technically always an error - for
              // example if we are deploying the backend, the connection
              // will close. Is there a way to not log if it's expected closure?
              LoggerService.noticeError(
                'Zwibbler: Unexpectedly closing WS connection',
                {
                  sessionId: this.sessionId,
                  userType: this.userType,
                  isZwibserveSession: this.isZwibserveSession,
                }
              )
            }

            zwibblerOnClose(closeEvent)
          }

          // Ping server every 45 seconds to keep the connection open.
          this.pingPongInterval = window.setInterval(() => {
            zwibblerWsConnection.send('p1ng')
          }, secondsInMs(45))
        }

        // Set brush tool to default tool.
        this.useBrushTool()
      })

      this.zwibblerCtx.on('resource-loaded', () => {
        const nodeId = this.uploadingImageNodeId

        //partner resource was added
        if (!nodeId) {
          return
        }
        const nodeDimensions = this.zwibblerCtx.getNodeRectangle(nodeId)

        const whiteboard = document.querySelector('#zwib-div')
        const whiteboardWidth = whiteboard.clientWidth
        const whiteboardHeight = whiteboard.clientHeight
        let scaleFactor = 1

        // Scale image below the whiteboard width and height.
        if (nodeDimensions.width > whiteboardWidth) {
          scaleFactor = 1 / (nodeDimensions.width / whiteboardWidth + 1)
          this.zwibblerCtx.scaleNode(nodeId, scaleFactor, scaleFactor)
        } else if (nodeDimensions.height > whiteboardHeight) {
          scaleFactor = 1 / (nodeDimensions.height / whiteboardHeight + 1)
          this.zwibblerCtx.scaleNode(nodeId, scaleFactor, scaleFactor)
        } else this.zwibblerCtx.scaleNode(nodeId, scaleFactor, scaleFactor)

        const currentView = this.zwibblerCtx.getViewRectangle()
        this.zwibblerCtx.translateNode(nodeId, currentView.x, currentView.y)

        // Keep opacity at 0 until image has been resized (avoids flashing full size)
        this.zwibblerCtx.setNodeProperty(nodeId, 'opacity', 1)
        this.uploadingImageNodeId = null
        this.isLoading = false
      })

      this.zwibblerCtx.on('connect-error', () => {
        this.isConnected = false
        this.loadingText = null
        window.clearInterval(this.pingPongInterval)
        this.zwibblerCtx.setConfig('readOnly', true)
        LoggerService.noticeError('Zwibbler: Received connect-error.', {
          sessionId: this.sessionId,
          isZwibserveSession: this.isZwibserveSession,
        })
        AnalyticsService.captureEvent(EVENTS.ZWIBBLER_CONNECT_ERROR, {
          sessionId: this.sessionId,
          isZwibserveSession: this.isZwibserveSession,
        })
      })

      // disallow dragging and pasting to the whiteboard
      this.zwibblerCtx.on('paste', () => {
        return false
      })

      this.zwibblerCtx.on('document-changed', () => {
        if (this.showShapePicker) {
          this.showShapePicker = false
        }
      })

      this.zwibblerCtx.on(
        'nodes-added',
        async (nodeIds, _unused, isRemoteChange) => {
          if (!isRemoteChange) {
            await this.maybeHandleTextNodeInfraction(nodeIds)
          }
        }
      )

      this.zwibblerCtx.on(
        'nodes-changed',
        async (nodeIds, _unused, isRemoteChange) => {
          if (!isRemoteChange) {
            await this.maybeHandleTextNodeInfraction(nodeIds)
          }
        }
      )

      try {
        await this.joinSharedSessionWithRetry()
      } catch (err) {
        LoggerService.noticeError(err, {
          sessionId: this.sessionId,
          isZwibserveSession: this.isZwibserveSession,
        })
      }
    },

    async joinSharedSessionWithRetry() {
      const MAX_RETRIES = 5
      const TIMEOUT_MS = secondsInMs(5)
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
                      isZwibserveSession: this.isZwibserveSession,
                    }
                  )
                  AnalyticsService.captureEvent(EVENTS.ZWIBBLER_CONNECTED, {
                    sessionId: this.sessionId,
                    attemptNumber: currentAttempt,
                    isZwibserveSession: this.isZwibserveSession,
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
                  isZwibserveSession: this.isZwibserveSession,
                }
              )
              AnalyticsService.captureEvent(EVENTS.ZWIBBLER_FAILED_TO_CONNECT, {
                sessionId: this.sessionId,
                attemptNumber,
                isZwibserveSession: this.isZwibserveSession,
              })
              return true
            },
          }
        )
      } catch {
        this.isConnected = false
        this.loadingText = null
        LoggerService.noticeError(
          `Zwibbler: Failed to connect to collaboration server after ${MAX_RETRIES} retries.`,
          {
            sessionId: this.sessionId,
            retries: MAX_RETRIES,
            timeout: TIMEOUT_MS,
            isZwibserveSession: this.isZwibserveSession,
          }
        )
        AnalyticsService.captureEvent(EVENTS.ZWIBBLER_FAILED_TO_CONNECT, {
          sessionId: this.sessionId,
          attemptNumber: MAX_RETRIES,
          isFinal: true,
          isZwibserveSession: this.isZwibserveSession,
        })
      }
    },
    handleImageFailedModeration(failures, isPartnerFailure) {
      AnalyticsService.captureEvent(EVENTS.IMAGE_UPLOAD_IMAGE_CENSORED, {
        tool: 'whiteboard',
      })
      this.$store.commit('liveMedia/setModerationInfraction', {
        infraction: failures,
        source: isPartnerFailure
          ? this.isStudent
            ? 'session_partner_coach_image_upload'
            : 'session_partner_student_image_upload'
          : 'image_upload',
        isBanned: false,
        occurredAt: new Date(),
      })
    },
  },
  async beforeUnmount() {
    await this.$store.dispatch('socket/resetPartnerImageUploadStatus')
    this.removeListeners()
    window.clearInterval(this.pingPongInterval)
    // Zwibbler cleanup.
    // This method doesn't exist in zwibbler-demo.js
    if (this.zwibblerCtx?.leaveSharedSession) {
      this.zwibblerCtx.leaveSharedSession()
    }
    this.zwibblerCtx.destroy()
    this.zwibblerCtx = null
    await this.$store.dispatch('session/setZwibbler', null)
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
            }, secondsInMs(10))
            break
          case PARTNER_IMAGE_UPLOAD_STATUS.GENERAL_ERROR:
            this.showErrorToast(getPartnerUploadFailedMsg(this.isStudent))
            this.loadingText = null
            break
          case PARTNER_IMAGE_UPLOAD_STATUS.MODERATION_FAILURE:
            this.handleImageFailedModeration(this.partnerImageUploadError, true)
            this.loadingText = null
            break
          case PARTNER_IMAGE_UPLOAD_STATUS.SUCCESS:
            this.loadingText = null
            break
        }
      }
    },
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
      if (isSessionOver && !oldIsSessionOver) {
        this.zwibblerCtx.setConfig('readOnly', true)
        this.removeListeners()
      }
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
</style>
