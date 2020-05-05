<template>
  <div class="zwib-wrapper">
    <div id="zwib-div" :style="mouseCursor"></div>
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
        v-bind:class="selectedTool === 'pen' ? 'selected-tool' : ''"
        @click="useBrushTool"
      >
        <PenIcon class="toolbar-item__svg" />
      </div>
      <div
        class="toolbar-item toolbar-item--color-picker"
        title="Color picker"
        @click="toggleColorPicker"
      >
        <ColorPickerIcon class="toolbar-item__svg" />
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
      scrollbars: this.mobileMode ? false : true,
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
    usePickTool() {
      this.zwibblerCtx.usePickTool();
      this.selectedTool = "pick";
      this.showColorPicker = false;
    },
    clearWhiteboard() {
      this.zwibblerCtx.deleteNodes(this.zwibblerCtx.getAllNodes());
      this.showColorPicker = false;
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

.toolbar {
  max-width: 400px;
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
</style>
