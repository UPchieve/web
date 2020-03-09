<template>
  <div class="zwib-wrapper">
    <cross-icon
      v-if="showDeleteStroke"
      :style="{
        position: 'absolute',
        top: deleteIconCoordinates.y - 50,
        left: deleteIconCoordinates.x + deleteIconCoordinates.width + 10,
        zIndex: '1000'
      }"
      v-on:click="deleteSelectedNodes"
      class="tool__item-svg tool__item-delete"
    />
    <div id="zwib-div" :style="mousePointer"></div>
    <div id="toolbar">
      <div
        class="tool__item"
        v-bind:class="selectedTool === 'pick' ? 'selected-tool' : ''"
        @click="usePickTool"
      >
        <SelectionIcon class="tool__item-svg" />
      </div>
      <div
        class="tool__item"
        v-bind:class="selectedTool === 'pen' ? 'selected-tool' : ''"
        @click="useBrushTool"
      >
        <PenIcon class="tool__item-svg" />
      </div>
      <div
        class="tool__item tool__item-color-picker"
        @click="toggleColorPicker"
      >
        <ColorPickerIcon class="tool__item-svg" />
        <div v-if="showColorPicker" class="color-bar">
          <button
            class="color-button"
            style="background-color: rgba(10, 10, 10, 1)"
            @click="setColor('rgba(10, 10, 10, 1)')"
          />
          <button
            class="color-button"
            style="background-color: rgba(38, 51, 104, 1)"
            @click="setColor('rgba(38, 51, 104, 1)')"
          />
          <button
            class="color-button"
            style="background-color: rgba(244, 71, 71, 1)"
            @click="setColor('rgba(244, 71, 71, 1)')"
          />
          <button
            class="color-button"
            style="background-color: rgba(255, 208, 115, 0.6)"
            @click="setColor('rgba(255, 208, 115, 0.6)')"
          />
          <button
            class="color-button"
            style="background-color: rgba(22, 210, 170, 0.6)"
            @click="setColor('rgba(22, 210, 170, 0.6)')"
          />
          <button
            class="color-button"
            style="background-color: rgba(24, 85, 209, 0.6)"
            @click="setColor('rgba(24, 85, 209, 0.6)')"
          />
        </div>
      </div>
      <div class="tool__item" @click="undo">
        <UndoIcon class="tool__item-svg" />
      </div>
      <div class="tool__item" @click="redo">
        <RedoIcon class="tool__item-svg" />
      </div>
      <div class="tool__item" @click="clearWhiteboard">
        <ClearIcon class="tool__item-svg" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import SelectionIcon from "@/assets/whiteboard_icons/selection.svg";
import ClearIcon from "@/assets/whiteboard_icons/clear.svg";
import ColorPickerIcon from "@/assets/whiteboard_icons/color_picker.svg";
import PenIcon from "@/assets/whiteboard_icons/pen.svg";
import UndoIcon from "@/assets/whiteboard_icons/undo.svg";
import RedoIcon from "@/assets/whiteboard_icons/redo.svg";
import CrossIcon from "@/assets/cross.svg";

export default {
  components: {
    SelectionIcon,
    ClearIcon,
    ColorPickerIcon,
    PenIcon,
    UndoIcon,
    RedoIcon,
    CrossIcon
  },
  data() {
    return {
      zwibbler: null,
      selectedTool: "pen",
      showColorPicker: false,
      deleteIconCoordinates: {},
      showDeleteStroke: false,
      isMouseDown: false
    };
  },
  computed: {
    ...mapState({
      session: state => state.user.session
    }),
    mousePointer() {
      if (this.selectedTool === "pen") return { cursor: "crosshair" };
      if (this.selectedTool === "pick") return { cursor: "default" };
      return { cursor: "default" };
    }
  },
  mounted() {
    document.addEventListener("click", () => {
      var rect = this.zwibblerCtx.getBoundingRectangle(
        this.zwibblerCtx.getSelectedNodes()
      );
      if (this.selectedTool === "pick" && rect.x && rect.y) {
        this.deleteIconCoordinates = rect;
        this.showDeleteStroke = true;
      }
    });

    const zwibblerCtx = window.Zwibbler.create("zwib-div", {
      showToolbar: false,
      showColourPanel: false,
      autoPickToolText: false,
      collaborationServer: `${
        process.env.VUE_APP_WEBSOCKET_ROOT
      }/whiteboard/room/{name}`
    });

    this.zwibblerCtx = zwibblerCtx;

    zwibblerCtx.createSharedSession(this.session._id);

    this.useBrushTool();
  },
  methods: {
    usePickTool() {
      this.zwibblerCtx.usePickTool();
      this.selectedTool = "pick";
      this.showColorPicker = false;
    },
    clearWhiteboard() {
      this.zwibblerCtx.deletePage(this.zwibblerCtx.getCurrentPage());
      this.selectedTool = "";
      this.showColorPicker = false;
      this.useBrushTool();
      this.showDeleteStroke = false;
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
      this.showDeleteStroke = false;
    },
    redo() {
      this.zwibblerCtx.redo();
      this.showColorPicker = false;
      this.showDeleteStroke = false;
    },
    setColor(color) {
      // Second parameter indicates whether the colour should affect the fill or outline colour.
      const useFill = true;
      this.zwibblerCtx.setColour(color, useFill);
    },
    deleteSelectedNodes() {
      this.zwibblerCtx.deleteNodes(this.zwibblerCtx.getSelectedNodes());
      this.showDeleteStroke = !this.showDeleteStroke;
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

  &-svg {
    width: 20px;
  }

  &-delete {
    fill: #b55050;
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
