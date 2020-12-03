<template>
  <div class="zwib-wrapper" :class="toolClass">
    <reset-whiteboard-modal
      v-if="showResetWhiteboardModal"
      :setShouldResetWhiteboard="setShouldResetWhiteboard"
      :closeModal="toggleResetWhiteboardModal"
    />
    <div
      id="zwib-div"
      :class="{ 'whiteboard-open': isWhiteboardOpen }"
      ref="zwibDiv"
    ></div>
    <transition name="reset-whiteboard-error">
      <p class="reset-whiteboard-error " v-show="resetWhiteboardError">
        Unable to reset the whiteboard.
      </p>
    </transition>
    <div id="toolbar" class="toolbar">
      <p v-if="error" class="whiteboard-error">{{ error }}</p>
      <div
        class="toolbar-item toolbar-item--pick"
        title="Pick tool"
        v-bind:class="selectedTool === 'pick' ? 'selected-tool' : ''"
        @click="usePickTool"
      >
        <SelectionIcon class="toolbar-item__svg" />
      </div>
      <div
        class="toolbar-item toolbar-item--brush"
        title="Brush tool"
        v-bind:class="selectedTool === 'brush' ? 'selected-tool' : ''"
        @click="useBrushTool"
      >
        <PenIcon class="toolbar-item__svg" />
      </div>
      <div
        class="toolbar-item toolbar-item--shapes"
        title="Shapes"
        @click="toggleShapes"
        :class="isShapeSelected ? 'selected-tool' : ''"
      >
        <ShapesIcon class="toolbar-item__svg toolbar-item__svg--shapes" />
        <div v-if="showShapes" class="shapes-bar">
          <div
            class="toolbar-item shapes-bar__toolbar-item"
            :class="selectedTool === 'line' ? 'selected-tool' : ''"
            @click="useLineTool"
          >
            <line-icon class="shapes-bar__shape-icon" title="Line tool" />
          </div>
          <div
            class="toolbar-item shapes-bar__toolbar-item"
            :class="selectedTool === 'circle' ? 'selected-tool' : ''"
            @click="useCircleTool"
          >
            <circle-icon class="shapes-bar__shape-icon" title="Circle tool" />
          </div>
          <div
            class="toolbar-item shapes-bar__toolbar-item"
            :class="selectedTool === 'polygon' ? 'selected-tool' : ''"
            @click="useTriangleTool"
          >
            <triangle-icon
              class="shapes-bar__shape-icon"
              title="Triangle tool"
            />
          </div>
          <div
            class="toolbar-item shapes-bar__toolbar-item"
            :class="selectedTool === 'rectangle' ? 'selected-tool' : ''"
            @click="useRectangleTool"
          >
            <rectangle-icon
              class="shapes-bar__shape-icon"
              title="Rectangle tool"
            />
          </div>
        </div>
      </div>
      <div
        class="toolbar-item toolbar-item--text"
        :class="selectedTool === 'text' ? 'selected-tool' : ''"
        title="Text"
        @click="useTextTool"
      >
        <TextIcon class="toolbar-item__svg" />
      </div>
      <div
        class="toolbar-item toolbar-item--color-picker"
        title="Color picker"
        @click="toggleColorPicker"
      >
        <ColorPickerIcon
          class="toolbar-item__svg toolbar-item__svg--color-picker"
        />
        <div v-if="showColorPicker" class="color-bar">
          <div
            class="color-button"
            title="Black"
            style="background-color: rgba(10, 10, 10, 1)"
            @click="setColor('rgba(10, 10, 10, 1)')"
          ></div>
          <div
            class="color-button"
            title="Navy"
            style="background-color: rgba(38, 51, 104, 1)"
            @click="setColor('rgba(38, 51, 104, 1)')"
          ></div>
          <div
            class="color-button"
            title="Red"
            style="background-color: rgba(244, 71, 71, 1)"
            @click="setColor('rgba(244, 71, 71, 1)')"
          ></div>
          <div
            class="color-button"
            title="Sand"
            style="background-color: rgba(249, 227, 183, 1)"
            @click="setColor('rgba(249, 227, 183, 1)')"
          ></div>
          <div
            class="color-button"
            title="Teal"
            style="background-color: rgba(123, 222, 201, 1)"
            @click="setColor('rgba(123, 222, 201, 1)')"
          ></div>
          <div
            class="color-button"
            title="Light Blue"
            style="background-color: rgba(119, 151, 216, 1)"
            @click="setColor('rgba(119, 151, 216, 1)')"
          ></div>
        </div>
      </div>
      <div class="toolbar-item toolbar-item--undo" title="Undo" @click="undo">
        <UndoIcon class="toolbar-item__svg" />
      </div>
      <div class="toolbar-item toolbar-item--redo" title="Redo" @click="redo">
        <RedoIcon class="toolbar-item__svg" />
      </div>
      <div
        v-if="showPhotoUpload"
        class="toolbar-item toolbar-item--photo"
        title="Upload photo"
        @click="openFileDialog"
      >
        <input
          type="file"
          class="upload-photo"
          accept="image/*"
          @change="uploadPhoto"
        />
        <PhotoUploadIcon class="toolbar-item__svg--photo" />
      </div>
      <div
        class="toolbar-item toolbar-item--clear"
        title="Clear whiteboard"
        @click="clearWhiteboard"
      >
        <ClearIcon class="toolbar-item__svg" />
      </div>
      <div
        class="toolbar-item toolbar-item--reset"
        title="Reset whiteboard"
        @click="toggleResetWhiteboardModal"
      >
        <ResetIcon class="toolbar-item__svg--reset" />
      </div>
    </div>
    <div v-if="isLoading" class="loading-overlay">
      <loader />
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import axios from "axios";
import NetworkService from "@/services/NetworkService";
import isOutdatedMobileAppVersion from "@/utils/is-outdated-mobile-app-version";
import SelectionIcon from "@/assets/whiteboard_icons/selection.svg";
import ClearIcon from "@/assets/whiteboard_icons/clear.svg";
import ColorPickerIcon from "@/assets/whiteboard_icons/color_picker.svg";
import PenIcon from "@/assets/whiteboard_icons/pen.svg";
import UndoIcon from "@/assets/whiteboard_icons/undo.svg";
import RedoIcon from "@/assets/whiteboard_icons/redo.svg";
import DeleteSelectionIcon from "@/assets/whiteboard_icons/delete_selection.png";
import RotateIcon from "@/assets/whiteboard_icons/rotate.png";
import PhotoUploadIcon from "@/assets/whiteboard_icons/photo-upload.svg";
import ShapesIcon from "@/assets/whiteboard_icons/shapes.svg";
import TextIcon from "@/assets/whiteboard_icons/text.svg";
import CircleIcon from "@/assets/whiteboard_icons/circle.svg";
import RectangleIcon from "@/assets/whiteboard_icons/rectangle.svg";
import TriangleIcon from "@/assets/whiteboard_icons/triangle.svg";
import LineIcon from "@/assets/whiteboard_icons/line.svg";
import ResetIcon from "@/assets/whiteboard_icons/reset.svg";
import Loader from "@/components/Loader";
import ResetWhiteboardModal from "./ResetWhiteboardModal";
import * as Sentry from "@sentry/browser";
import config from "../../config";

export default {
  components: {
    SelectionIcon,
    ClearIcon,
    ColorPickerIcon,
    PenIcon,
    UndoIcon,
    RedoIcon,
    PhotoUploadIcon,
    ShapesIcon,
    TextIcon,
    CircleIcon,
    RectangleIcon,
    TriangleIcon,
    LineIcon,
    ResetIcon,
    Loader,
    ResetWhiteboardModal
  },
  props: {
    sessionId: {
      type: String,
      required: true
    },
    isWhiteboardOpen: {
      type: Boolean,
      required: true
    },
    toggleWhiteboard: {
      type: Function,
      required: true
    },
    isSessionOver: {
      type: Boolean,
      required: true
    },
    openFileDialog: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      zwibblerCtx: null,
      selectedTool: "",
      showColorPicker: false,
      error: "",
      showShapes: false,
      // used to determine the beginning and end node of a shape
      shapeNodes: [],
      isLoading: false,
      canvasHeight: 2800,
      canvasWidth: 1000,
      pingPongInterval: null,
      isConnected: false,
      hadConnectionIssue: false,
      showResetWhiteboardModal: false,
      shouldResetWhiteboard: false,
      resetWhiteboardError: false
    };
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp,
      isSessionConnectionAlive: state => state.user.isSessionConnectionAlive
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode",
      isVolunteer: "user/isVolunteer"
    }),
    toolClass() {
      if (this.selectedTool === "brush") return "zwib-wrapper--brush";
      if (this.selectedTool === "pick") return "zwib-wrapper--pick";
      if (this.selectedTool === "line") return "zwib-wrapper--line";
      if (this.selectedTool === "circle") return "zwib-wrapper--circle";
      if (this.selectedTool === "rectangle") return "zwib-wrapper--rectangle";
      if (this.selectedTool === "polygon") return "zwib-wrapper--triangle";
      if (this.selectedTool === "text") return "zwib-wrapper--text";

      return "zwib-wrapper--default";
    },
    showPhotoUpload() {
      if (!this.isVolunteer) {
        if (this.isMobileApp && isOutdatedMobileAppVersion()) return false;
        return true;
      }

      return false;
    },
    isShapeSelected() {
      return (
        this.selectedTool === "line" ||
        this.selectedTool === "circle" ||
        this.selectedTool === "polygon" ||
        this.selectedTool === "rectangle"
      );
    }
  },
  updated() {
    if (this.error) {
      setTimeout(() => {
        this.error = "";
      }, 2000);
    }
  },
  mounted() {
    this.loadZwibbler();
  },
  methods: {
    resizeViewRectangle() {
      this.zwibblerCtx.setViewRectangle({
        x: 0,
        y: 0,
        width: this.canvasWidth,
        height: 1
      });
    },
    handleOrientationChange() {
      setTimeout(this.resizeViewRectangle, 100);
    },
    handleWindowResize() {
      setTimeout(this.resizeViewRectangle, 100);
    },
    usePickTool() {
      this.zwibblerCtx.usePickTool();
    },
    useBrushTool() {
      this.zwibblerCtx.useBrushTool();
    },
    useLineTool() {
      this.zwibblerCtx.useLineTool(
        {},
        {
          singleLine: true
        }
      );
    },
    useCircleTool() {
      this.zwibblerCtx.useCircleTool();
    },
    useTriangleTool() {
      this.zwibblerCtx.usePolygonTool(3, 0);
    },
    useRectangleTool() {
      this.zwibblerCtx.useRectangleTool();
    },
    useTextTool() {
      this.zwibblerCtx.useTextTool();
    },
    toggleColorPicker() {
      this.showColorPicker = !this.showColorPicker;
      this.showShapes = false;
    },
    toggleShapes() {
      this.showShapes = !this.showShapes;
      this.showColorPicker = false;
    },
    undo() {
      this.zwibblerCtx.undo();
      this.hideHoveredToolbars();
    },
    redo() {
      this.zwibblerCtx.redo();
      this.hideHoveredToolbars();
    },
    hideHoveredToolbars() {
      this.showColorPicker = false;
      this.showShapes = false;
    },
    async uploadPhoto(event) {
      const { files } = event.target;
      const file = files[0];
      const tenMegabytes = 10 * 1000000;

      if (!this.isWhiteboardOpen && this.mobileMode) this.toggleWhiteboard();

      if (file.size > tenMegabytes) {
        this.error =
          "The photo is too large. Please upload a photo less than 10mb.";
        return;
      }
      this.usePickTool();

      const response = await NetworkService.getSessionPhotoUploadUrl(
        this.sessionId
      );
      const {
        body: { uploadUrl, imageUrl }
      } = response;

      if (uploadUrl) {
        this.isLoading = true;
        await axios.put(uploadUrl, file, {
          headers: {
            "Content-Type": file.type
          }
        });

        this.insertPhoto(imageUrl);
      }

      // Reset the file input
      event.target.value = "";
    },
    insertPhoto(imageUrl) {
      const nodeId = this.zwibblerCtx.createNode("ImageNode", {
        url: imageUrl,
        opacity: 0
      });

      this.zwibblerCtx.on("resource-loaded", () => {
        const nodeDimensions = this.zwibblerCtx.getNodeRectangle(nodeId);
        const whiteboard = document.querySelector("#zwib-div");
        const whiteboardWidth = whiteboard.clientWidth;
        const whiteboardHeight = whiteboard.clientHeight;
        let scaleFactor = 1;

        // scale image below the whiteboard width and height
        if (nodeDimensions.width > whiteboardWidth) {
          scaleFactor = 1 / (nodeDimensions.width / whiteboardWidth + 1);
          this.zwibblerCtx.scaleNode(nodeId, scaleFactor, scaleFactor);
        } else if (nodeDimensions.height > whiteboardHeight) {
          scaleFactor = 1 / (nodeDimensions.height / whiteboardHeight + 1);
          this.zwibblerCtx.scaleNode(nodeId, scaleFactor, scaleFactor);
        } else this.zwibblerCtx.scaleNode(nodeId, scaleFactor, scaleFactor);

        // Keep opacity at 0 until image has been resized (avoids flashing full size)
        this.zwibblerCtx.setNodeProperty(nodeId, "opacity", 1);
        this.isLoading = false;
      });
    },
    clearWhiteboard() {
      this.zwibblerCtx.deleteNodes(this.zwibblerCtx.getAllNodes());
    },
    setColor(color) {
      // Second parameter indicates whether the colour should affect the fill or outline colour.
      const useFill = true;
      this.zwibblerCtx.setColour(color, useFill);
    },
    setSelectionHandles() {
      // Remove all pre-defined selection handles.
      this.zwibblerCtx.removeSelectionHandles();

      // Add custom selection handle for deleting selection,
      // positioned in the top-right of the selection.
      this.zwibblerCtx.addSelectionHandle(
        1.0,
        0.0,
        20,
        -30,
        DeleteSelectionIcon,
        () => this.zwibblerCtx.deleteSelection()
      );

      // Add rotation handle with custom icon,
      // positioned in the top-middle of the selection.
      this.zwibblerCtx.addSelectionHandle(
        0.5,
        0.0,
        0,
        -30,
        RotateIcon,
        "rotate"
      );

      // Re-add default scaling handles.

      // Position scaling handles at all four corners of the selection.
      this.zwibblerCtx.addSelectionHandle(0.0, 0.0, 0, 0, "", "scale");
      this.zwibblerCtx.addSelectionHandle(1.0, 0.0, 0, 0, "", "scale");
      this.zwibblerCtx.addSelectionHandle(1.0, 1.0, 0, 0, "", "scale");
      this.zwibblerCtx.addSelectionHandle(0.0, 1.0, 0, 0, "", "scale");

      // Position more scaling handles at the midpoints of each side of the selection.
      this.zwibblerCtx.addSelectionHandle(0.5, 0.0, 0, 0, "", "scale");
      this.zwibblerCtx.addSelectionHandle(1.0, 0.5, 0, 0, "", "scale");
      this.zwibblerCtx.addSelectionHandle(0.5, 1.0, 0, 0, "", "scale");
      this.zwibblerCtx.addSelectionHandle(0.0, 0.5, 0, 0, "", "scale");
    },
    setShouldResetWhiteboard(value) {
      this.shouldResetWhiteboard = value;
    },
    toggleResetWhiteboardModal() {
      this.showResetWhiteboardModal = !this.showResetWhiteboardModal;
    },
    async resetWhiteboard() {
      try {
        await NetworkService.resetWhiteboard({ sessionId: this.sessionId });
      } catch (error) {
        this.resetWhiteboardError = true;
        setTimeout(() => {
          this.resetWhiteboardError = false;
        }, 2000);
        return;
      }

      window.clearInterval(this.pingPongInterval);
      this.zwibblerCtx.destroy();
      this.loadZwibbler();
      this.$socket.emit("resetWhiteboard", {
        sessionId: this.sessionId
      });
      this.setShouldResetWhiteboard(false);
    },
    async loadZwibbler() {
      const zwibblerCtx = window.Zwibbler.create("zwib-div", {
        showToolbar: false,
        showColourPanel: false,
        autoPickTool: false,
        autoPickToolText: false,
        defaultBrushWidth: 5,
        allowZoom: false,
        pageView: true,
        pageInflation: 0,
        pageShadow: false,
        outsidePageColour: "#fff",
        defaultSmoothness: "sharpest",
        multilineText: true,
        scrollbars: true,
        defaultFontSize: 32,
        background: "grid",
        collaborationServer: `${config.websocketRoot}/whiteboard/room/{name}`
      });

      this.zwibblerCtx = zwibblerCtx;

      // Set paper size
      this.zwibblerCtx.setPaperSize(this.canvasWidth, this.canvasHeight);

      // Zoom to full width
      this.resizeViewRectangle();

      // Join or create shared zwibbler session
      try {
        await this.zwibblerCtx.joinSharedSession(this.sessionId, true);
      } catch (error) {
        Sentry.captureException(error);
      }

      // Set up custom selection handles
      this.setSelectionHandles();

      // disable showing hints on the canvas
      this.zwibblerCtx.setConfig("showHints", false);

      // read-only until connected
      this.zwibblerCtx.setConfig("readOnly", true);

      this.zwibblerCtx.on("connected", () => {
        this.isConnected = true;
        this.zwibblerCtx.setConfig("readOnly", false);

        // @todo access the connection in a less sketchy way
        const zwibblerWsConnection = this.zwibblerCtx.mc.Yb.Yb;
        const zwibblerOnMessage = zwibblerWsConnection.onmessage;
        // Intercept Zwibbler's websocket message handler
        zwibblerWsConnection.onmessage = messageEvent => {
          // Forward message to Zwibbler unless it's our "pong" response
          if (messageEvent.data !== "p0ng") zwibblerOnMessage(messageEvent);
        };

        // Ping server every 45 seconds to keep the connection open
        this.pingPongInterval = window.setInterval(() => {
          zwibblerWsConnection.send("p1ng");
        }, 45 * 1000);

        // Set brush tool to default tool
        this.useBrushTool();

        this.resizeViewRectangle();

        // Don't start setting selected tool until connected
        this.zwibblerCtx.on("tool-changed", toolname => {
          this.selectedTool = toolname;
          this.hideHoveredToolbars();
        });
      });

      this.zwibblerCtx.on("connect-error", () => {
        this.zwibblerCtx.stopSharing();
        this.isConnected = false;
        this.hadConnectionIssue = true;
        window.clearInterval(this.pingPongInterval);
        this.zwibblerCtx.setConfig("readOnly", true);
      });

      // disallow dragging and pasting to the whiteboard
      this.zwibblerCtx.on("paste", () => {
        return false;
      });

      this.zwibblerCtx.on("nodes-added", nodes => {
        if (this.isShapeSelected) this.shapeNodes.push(nodes[0]);
        if (this.selectedTool === "text") this.usePickTool();
      });

      window.addEventListener(
        "orientationchange",
        this.handleOrientationChange,
        false
      );

      window.addEventListener("resize", this.handleWindowResize, false);

      this.zwibblerCtx.on("document-changed", info => {
        const isRemoteChange = info && info.remote;
        const isWhiteboardHidden = this.mobileMode && !this.isWhiteboardOpen;
        const shouldResizeView = isRemoteChange && isWhiteboardHidden;
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
              );
            } catch (error) {
              this.resizeViewRectangle();
            }
          }, 500);
        }
      });
    }
  },
  beforeDestroy() {
    window.removeEventListener(
      "orientationchange",
      this.handleOrientationChange,
      false
    );
    window.removeEventListener("resize", this.handleWindowResize, false);
    window.clearInterval(this.pingPongInterval);
  },
  watch: {
    shapeNodes() {
      // Use the pick tool after the end node for a shape was added
      if (this.shapeNodes.length === 2 && this.isShapeSelected) {
        this.usePickTool();
        this.shapeNodes = [];
      }
    },
    isSessionOver(isSessionOver, oldIsSessionOver) {
      if (isSessionOver && !oldIsSessionOver)
        this.zwibblerCtx.setConfig("readOnly", true);
    },
    isSessionConnectionAlive(newValue, oldValue) {
      if (!this.hadConnectionIssue) return; // On initial connection, early exit
      if (this.isConnected) return; // Already connected, so early exit
      if (newValue && !oldValue) {
        // Socket.io just reconnected, so try reconnecting Zwibbler (but first clear the document)
        this.zwibblerCtx.newDocument();
        this.zwibblerCtx.joinSharedSession(this.sessionId, false);
      }
    },
    shouldResetWhiteboard(currentValue) {
      if (currentValue) this.resetWhiteboard();
    }
  },
  sockets: {
    resetWhiteboard() {
      window.clearInterval(this.pingPongInterval);
      this.zwibblerCtx.destroy();
      this.loadZwibbler();
    }
  }
};
</script>

<style lang="scss">
.zwib-wrapper {
  height: 100%;
  width: 100%;
  position: relative;

  &--brush,
  &--circle,
  &--rectangle,
  &--triangle {
    .zwibbler-canvas-holder {
      cursor: crosshair !important;
    }
  }

  &--pick {
    .zwibbler-canvas-holder {
      cursor: default !important;
    }
  }

  &--text {
    .zwibbler-canvas-holder {
      cursor: text !important;
    }
  }

  &--default {
    .zwibbler-canvas-holder {
      cursor: default !important;
    }
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

  @include breakpoint-above("medium") {
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

  @include breakpoint-below("tiny") {
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

  &--pick {
    & .toolbar-item__svg {
      width: 26px;
      height: 26px;

      padding: 3px 0 0 3px;
    }
  }

  &__svg {
    width: 20px;

    &--photo {
      height: 26px;
    }

    &--reset {
      width: 28px;
    }

    &--shapes {
      @include breakpoint-below("medium") {
        height: 22px;
        width: 22px;
      }
    }

    &--color-picker {
      height: 25px;
      width: 25px;
    }
  }

  &--shapes {
    position: relative;
  }
}

.selected-tool {
  background-color: #d5d5d5;
}

.color-bar {
  position: absolute;
  left: 0;
  right: 0;
  margin: 0 auto;
  bottom: 58px;
  display: flex;
  justify-content: space-around;
  background-color: #fff;
  border: 1px solid #d8d8d8;
  border-radius: 5px;
  width: 200px;
  padding: 10px 8px;
  cursor: default;

  @include breakpoint-latest-iphones {
    bottom: 88px;
  }
}

.color-button {
  height: 22px;
  width: 22px;
  border-radius: 22px;
  cursor: pointer;
  border: solid 2px #fff;
  transition: border-color 0.2s;

  &:hover {
    border-color: #ccc;
  }

  &:active {
    outline: none;
  }
}

.upload-photo {
  display: none !important;
}

.whiteboard-error {
  color: $c-error-red;
  position: absolute;
  bottom: 65px;
}

.shapes-bar {
  @include flex-container(row, space-around);
  position: absolute;
  left: -50px;
  margin: 0 auto;
  bottom: 58px;
  background-color: #fff;
  border: 1px solid #d8d8d8;
  border-radius: 5px;

  @include breakpoint-latest-iphones {
    bottom: 88px;
  }

  &__toolbar-item {
    border-radius: initial !important;
    padding: 0.5em;

    @include breakpoint-below("tiny") {
      padding: 1em;
    }
  }

  &__shape-icon {
    width: 20px;
    height: 20px;
  }

  & .selected-tool {
    background-color: darken(#e2e2e2, 15%);
  }
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

.reset-whiteboard-error {
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
</style>
