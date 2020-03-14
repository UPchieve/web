<template>
  <div class="zwib-wrapper">
    <div id="zwib-div" :style="mouseCursor"></div>
    <div id="toolbar">
      <div
        class="tool__item"
        title="Drag tool"
        v-bind:class="selectedTool === 'pan' ? 'selected-tool' : ''"
        @click="usePanTool"
      >
        <PanIcon class="tool__item-svg" />
      </div>
      <div
        class="tool__item tool__item-pick"
        title="Pick tool"
        v-bind:class="selectedTool === 'pick' ? 'selected-tool' : ''"
        @click="usePickTool"
      >
        <SelectionIcon class="tool__item-svg" />
      </div>
      <div
        class="tool__item"
        title="Brush tool"
        v-bind:class="selectedTool === 'pen' ? 'selected-tool' : ''"
        @click="useBrushTool"
      >
        <PenIcon class="tool__item-svg" />
      </div>
      <div
        class="tool__item tool__item-color-picker"
        title="Color picker"
        @click="toggleColorPicker"
      >
        <ColorPickerIcon class="tool__item-svg" />
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
      <div class="tool__item" title="Undo" @click="undo">
        <UndoIcon class="tool__item-svg" />
      </div>
      <div class="tool__item" title="Redo" @click="redo">
        <RedoIcon class="tool__item-svg" />
      </div>
      <div class="tool__item" title="Clear whiteboard" @click="clearWhiteboard">
        <ClearIcon class="tool__item-svg" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import SelectionIcon from "@/assets/whiteboard_icons/selection.svg?inline";
import ClearIcon from "@/assets/whiteboard_icons/clear.svg?inline";
import ColorPickerIcon from "@/assets/whiteboard_icons/color_picker.svg?inline";
import PenIcon from "@/assets/whiteboard_icons/pen.svg?inline";
import UndoIcon from "@/assets/whiteboard_icons/undo.svg?inline";
import RedoIcon from "@/assets/whiteboard_icons/redo.svg?inline";
import DeleteSelectionIcon from "@/assets/whiteboard_icons/delete_selection.svg";
import RotateIcon from "@/assets/whiteboard_icons/rotate.svg";
import PanIcon from "@/assets/whiteboard_icons/grab.svg?inline";

export default {
  components: {
    SelectionIcon,
    ClearIcon,
    ColorPickerIcon,
    PenIcon,
    UndoIcon,
    RedoIcon,
    PanIcon
  },
  props: {
    shouldCreateSession: {
      type: Boolean,
      default: true
    },
    isVisible: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      zwibblerCtx: null,
      selectedTool: "pen",
      showColorPicker: false,
      isMouseDown: false
    };
  },
  computed: {
    ...mapState({
      session: state => state.user.session
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode"
    }),
    mouseCursor() {
      if (this.selectedTool === "pen") return { cursor: "crosshair" };
      if (this.selectedTool === "pick") return { cursor: "default" };
      if (this.selectedTool === "pan") return { cursor: "grab" };
      return { cursor: "default" };
    }
  },
  mounted() {
    const zwibblerCtx = window.Zwibbler.create("zwib-div", {
      showToolbar: false,
      showColourPanel: false,
      autoPickToolText: false,
      defaultBrushWidth: 5,
      collaborationServer: `${
        process.env.VUE_APP_WEBSOCKET_ROOT
      }/whiteboard/room/{name}`
    });

    this.zwibblerCtx = zwibblerCtx;

    if (this.shouldCreateSession) {
      this.zwibblerCtx.createSharedSession(this.session._id);
    } else {
      this.zwibblerCtx.joinSharedSession(this.session._id);
    }

    // Set up custom selection handles
    this.setSelectionHandles();

    // Set brush tool to default tool
    this.useBrushTool();

    this.zwibblerCtx.on("document-changed", info => {
      const isRemoteChange = info.remote;
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
    usePickTool() {
      this.zwibblerCtx.usePickTool();
      this.selectedTool = "pick";
      this.showColorPicker = false;
    },
    clearWhiteboard() {
      this.zwibblerCtx.deleteNodes(this.zwibblerCtx.getAllNodes());
      this.selectedTool = "";
      this.showColorPicker = false;
      this.useBrushTool();
    },
    toggleColorPicker() {
      this.showColorPicker = !this.showColorPicker;
    },
    useBrushTool() {
      this.zwibblerCtx.useBrushTool();
      this.selectedTool = "pen";
      this.showColorPicker = false;
    },
    undo() {
      this.zwibblerCtx.undo();
      this.showColorPicker = false;
    },
    redo() {
      this.zwibblerCtx.redo();
      this.showColorPicker = false;
    },
    usePanTool() {
      this.zwibblerCtx.usePanTool();
      this.selectedTool = "pan";
      this.showColorPicker = false;
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
    }
  }
};
</script>

<style lang="scss">
.zwib-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
}

#zwib-div {
  height: 100%;
  width: 100%;
}

.zwibbler-scrollbar {
  cursor: default;
}

#toolbar {
  max-width: 400px;
  height: 70px;
  position: absolute;
  bottom: 40px;
  left: 0;
  right: 0;
  margin: auto;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-radius: 8px;
  background-color: rgb(238, 238, 238);
}

.tool__item {
  padding: 1em;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

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

  &-pick {
    // Pick tool / select tool
    & svg {
      width: 26px;
      height: 26px;

      padding: 3px 0 0 3px;
    }
  }

  &-svg {
    width: 20px;
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
</style>
