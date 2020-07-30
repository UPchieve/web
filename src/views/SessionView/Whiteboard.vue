<template>
  <div class="zwib-wrapper" :class="toolClass">
    <div id="zwib-div"></div>
    <div id="toolbar" class="toolbar">
      <div
        class="toolbar-item toolbar-item--drag"
        title="Drag tool"
        v-bind:class="selectedTool === 'pan' ? 'selected-tool' : ''"
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
        class="toolbar-item toolbar-item--clear"
        title="Clear whiteboard"
        @click="clearWhiteboard"
      >
        <ClearIcon class="toolbar-item__svg" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import SelectionIcon from "@/assets/whiteboard_icons/selection.svg";
import ClearIcon from "@/assets/whiteboard_icons/clear.svg";
import ColorPickerIcon from "@/assets/whiteboard_icons/color_picker.svg";
import PenIcon from "@/assets/whiteboard_icons/pen.svg";
import UndoIcon from "@/assets/whiteboard_icons/undo.svg";
import RedoIcon from "@/assets/whiteboard_icons/redo.svg";
import PanIcon from "@/assets/whiteboard_icons/grab.svg";
import DeleteSelectionIcon from "@/assets/whiteboard_icons/delete_selection.png";
import RotateIcon from "@/assets/whiteboard_icons/rotate.png";
import ShapesIcon from "@/assets/whiteboard_icons/shapes.svg";
import TextIcon from "@/assets/whiteboard_icons/text.svg";
import CircleIcon from "@/assets/whiteboard_icons/circle.svg";
import RectangleIcon from "@/assets/whiteboard_icons/rectangle.svg";
import TriangleIcon from "@/assets/whiteboard_icons/triangle.svg";
import LineIcon from "@/assets/whiteboard_icons/line.svg";

export default {
  components: {
    SelectionIcon,
    ClearIcon,
    ColorPickerIcon,
    PenIcon,
    UndoIcon,
    RedoIcon,
    PanIcon,
    ShapesIcon,
    TextIcon,
    CircleIcon,
    RectangleIcon,
    TriangleIcon,
    LineIcon
  },
  props: {
    isVisible: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      zwibblerCtx: null,
      selectedTool: "",
      showColorPicker: false,
      showShapes: false,
      isMouseDown: false,
      // used to determine the beginning and end node of a shape
      shapeNodes: [],
      // default scale factor for safari trackpad
      previousScale: 1
    };
  },
  computed: {
    ...mapState({
      session: state => state.user.session
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode"
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
    isShapeSelected() {
      return (
        this.selectedTool === "line" ||
        this.selectedTool === "circle" ||
        this.selectedTool === "polygon" ||
        this.selectedTool === "rectangle"
      );
    }
  },
  mounted() {
    const zwibblerCtx = window.Zwibbler.create("zwib-div", {
      showToolbar: false,
      showColourPanel: false,
      autoPickTool: false,
      autoPickToolText: false,
      defaultBrushWidth: 5,
      defaultSmoothness: "sharpest",
      multilineText: true,
      scrollbars: false,
      collaborationServer: `${
        process.env.VUE_APP_WEBSOCKET_ROOT
      }/whiteboard/room/{name}`
    });

    this.zwibblerCtx = zwibblerCtx;

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

    this.zwibblerCtx.on("nodes-added", nodes => {
      if (this.isShapeSelected) this.shapeNodes.push(nodes[0]);
      if (this.selectedTool === "text") this.usePickTool();
    });

    const zwibblerContainer = document.querySelector("#zwib-div");
    zwibblerContainer.addEventListener("wheel", this.trackpadListener, false);
    // Safari doesn't register wheel events for the trackpad pinch
    zwibblerContainer.addEventListener("gesturestart", this.safariTrackpadZoom);
    zwibblerContainer.addEventListener(
      "gesturechange",
      this.safariTrackpadZoom
    );
    zwibblerContainer.addEventListener("gestureend", this.safariTrackpadZoom);

    this.zwibblerCtx.on("document-changed", info => {
      const isRemoteChange = info && info.remote;
      const isWhiteboardHidden = this.mobileMode && !this.isVisible;
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
        const { deltaY } = event;
        if (deltaY > 0) this.zwibblerCtx.zoomOut();
        else this.zwibblerCtx.zoomIn();
      } else {
        const { deltaX, deltaY } = event;
        const rect = this.zwibblerCtx.getViewRectangle();
        rect.x += deltaX;
        rect.y += deltaY;
        this.zwibblerCtx.setViewRectangle(rect);
      }
    },
    safariTrackpadZoom(event) {
      event.preventDefault();
      const { scale } = event;
      if (scale > this.previousScale) this.zwibblerCtx.zoomOut();
      else this.zwibblerCtx.zoomIn();
      this.previousScale = scale;
    }
  },
  destroyed() {
    const zwibblerContainer = document.querySelector("#zwib-div");
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
</style>
