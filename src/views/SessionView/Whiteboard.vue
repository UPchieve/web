<template>
  <div class="zwib-wrapper" :class="toolClass">
    <div id="zwib-div" ref="zwibDiv"></div>
    <div id="toolbar" class="toolbar">
      <p v-if="error" class="whiteboard-error">{{ error }}</p>
      <div
        class="toolbar-item toolbar-item--drag"
        title="Drag tool"
        v-bind:class="selectedTool === 'pan' ? 'selected-tool' : ''"
        v-if="!mobileMode"
        @click="usePanTool"
      >
        <PanIcon class="toolbar-item__svg" />
      </div>
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
          class="toolbar-item__svg  toolbar-item__svg--color-picker"
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
          accept="image/jpg, image/png"
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
import PanIcon from "@/assets/whiteboard_icons/grab.svg";
import DeleteSelectionIcon from "@/assets/whiteboard_icons/delete_selection.png";
import RotateIcon from "@/assets/whiteboard_icons/rotate.png";
import PhotoUploadIcon from "@/assets/whiteboard_icons/photo-upload.svg";
import ShapesIcon from "@/assets/whiteboard_icons/shapes.svg";
import TextIcon from "@/assets/whiteboard_icons/text.svg";
import CircleIcon from "@/assets/whiteboard_icons/circle.svg";
import RectangleIcon from "@/assets/whiteboard_icons/rectangle.svg";
import TriangleIcon from "@/assets/whiteboard_icons/triangle.svg";
import LineIcon from "@/assets/whiteboard_icons/line.svg";
import Loader from "@/components/Loader";

export default {
  components: {
    SelectionIcon,
    ClearIcon,
    ColorPickerIcon,
    PenIcon,
    UndoIcon,
    RedoIcon,
    PanIcon,
    PhotoUploadIcon,
    ShapesIcon,
    TextIcon,
    CircleIcon,
    RectangleIcon,
    TriangleIcon,
    LineIcon,
    Loader
  },
  props: {
    isWhiteboardOpen: {
      type: Boolean,
      required: true
    },
    toggleWhiteboard: {
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
      // default scale factor for safari trackpad
      previousScale: 1,
      isLoading: false,
      minZoom: 0.5,
      maxZoom: 2.5
    };
  },
  computed: {
    ...mapState({
      session: state => state.user.session,
      isMobileApp: state => state.app.isMobileApp
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode",
      isVolunteer: "user/isVolunteer"
    }),
    toolClass() {
      if (this.selectedTool === "brush") return "zwib-wrapper--brush";
      if (this.selectedTool === "pick") return "zwib-wrapper--pick";
      if (this.selectedTool === "pan") return "zwib-wrapper--pan";
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
      scrollbars: false,
      background: "grid",
      collaborationServer: `${
        process.env.VUE_APP_WEBSOCKET_ROOT
      }/whiteboard/room/{name}`
    });

    this.zwibblerCtx = zwibblerCtx;

    // Set paper size
    this.zwibblerCtx.setPaperSize(1000, 3000);

    // Zoom to full width
    this.zwibblerCtx.setViewRectangle({ x: 0, y: 0, width: 1000, height: 1 });

    // Join or create shared zwibbler session
    this.zwibblerCtx.joinSharedSession(this.session._id, true);

    // Set up custom selection handles
    this.setSelectionHandles();

    // disable showing hints on the canvas
    this.zwibblerCtx.setConfig("showHints", false);

    this.zwibblerCtx.on("connected", () => {
      // Set brush tool to default tool
      this.useBrushTool();

      // Don't start setting selected tool until connected
      this.zwibblerCtx.on("tool-changed", toolname => {
        this.selectedTool = toolname;
        this.hideHoveredToolbars();
      });
    });

    // disallow dragging and pasting to the whiteboard
    this.zwibblerCtx.on("paste", () => {
      return false;
    });

    this.zwibblerCtx.on("nodes-added", nodes => {
      if (this.isShapeSelected) this.shapeNodes.push(nodes[0]);
      if (this.selectedTool === "text") this.usePickTool();
    });

    if (!this.mobileMode) {
      const zwibblerContainer = this.$refs.zwibDiv;
      zwibblerContainer.addEventListener("wheel", this.trackpadListener, false);
      // Safari doesn't register wheel events for the trackpad pinch
      zwibblerContainer.addEventListener(
        "gesturestart",
        this.safariTrackpadZoom
      );
      zwibblerContainer.addEventListener(
        "gesturechange",
        this.safariTrackpadZoom
      );
      zwibblerContainer.addEventListener("gestureend", this.safariTrackpadZoom);
    }

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
          this.zwibblerCtx.setViewRectangle(
            this.zwibblerCtx.getBoundingRectangle(
              this.zwibblerCtx.getAllNodes()
            )
          );
        }, 500);
      }
    });
  },
  methods: {
    usePanTool() {
      this.zwibblerCtx.usePanTool();
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
        this.session._id
      );
      const {
        body: { uploadUrl, imageUrl }
      } = response;

      if (uploadUrl) {
        this.isLoading = true;
        await axios.put(uploadUrl, file, {
          "Content-Type": file.type
        });

        this.insertPhoto(imageUrl);
      }

      // Reset the file input
      event.target.value = "";
    },
    openFileDialog() {
      document.querySelector(".upload-photo").click();
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
    trackpadListener(event) {
      event.preventDefault();
      // zoom in and out when pinching trackpad
      // otherwise pan the whiteboard
      if (event.ctrlKey) {
        const canvasScale = this.zwibblerCtx.getCanvasScale();
        const { deltaY } = event;
        if (deltaY > 0) {
          if (canvasScale >= this.minZoom) this.zwibblerCtx.zoomOut();
        } else if (deltaY < 0) {
          if (canvasScale < this.maxZoom) this.zwibblerCtx.zoomIn();
        }
      } else {
        const { deltaY } = event;
        const rect = this.zwibblerCtx.getViewRectangle();

        // Pan up
        if (deltaY < 0 && rect.y > 0) rect.y += deltaY;
        // Pan down
        else if (deltaY > 0 && rect.y + rect.height < 3000) rect.y += deltaY;

        // correct for over-scrolling
        if (rect.y < 0) rect.y = 0;
        else if (rect.y + rect.height > 3000) rect.y = 3000 - rect.height;

        this.zwibblerCtx.setViewRectangle(rect);
      }
    },
    safariTrackpadZoom(event) {
      event.preventDefault();
      const canvasScale = this.zwibblerCtx.getCanvasScale();
      const { scale } = event;
      if (scale > this.previousScale) {
        if (canvasScale < this.maxZoom) this.zwibblerCtx.zoomIn();
      } else if (scale < this.previousScale) {
        if (canvasScale >= this.minZoom) this.zwibblerCtx.zoomOut();
      }
      this.previousScale = scale;
    }
  },
  beforeDestroy() {
    if (!this.mobileMode) {
      const zwibblerContainer = this.$refs.zwibDiv;
      zwibblerContainer.removeEventListener(
        "wheel",
        this.trackpadListener,
        false
      );
      zwibblerContainer.removeEventListener(
        "gesturestart",
        this.safariTrackpadZoom
      );
      zwibblerContainer.removeEventListener(
        "gesturechange",
        this.safariTrackpadZoom
      );
      zwibblerContainer.removeEventListener(
        "gestureend",
        this.safariTrackpadZoom
      );
    }
  },
  watch: {
    shapeNodes() {
      // Use the pick tool after the end node for a shape was added
      if (this.shapeNodes.length === 2 && this.isShapeSelected) {
        this.usePickTool();
        this.shapeNodes = [];
      }
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

  &--pan {
    .zwibbler-canvas-holder {
      cursor: grab !important;
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
}

.zwibbler-canvas-holder,
.zwib-wrapper,
#zwib-div {
  &:focus {
    outline: none;
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
  right: 0;
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
  padding: 1em;
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
</style>
