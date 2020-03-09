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
    <ul id="toolbar">
      <li
        class="tool__item"
        v-bind:class="selectedTool === 'pick' ? 'selected-tool' : ''"
        @click="usePickTool"
      >
        <SelectionIcon class="tool__item-svg" />
      </li>
      <li
        class="tool__item"
        v-bind:class="selectedTool === 'pen' ? 'selected-tool' : ''"
        @click="useBrushTool"
      >
        <PenIcon class="tool__item-svg" />
      </li>
      <li class="tool__item tool__item-color-picker" @click="toggleColorPicker">
        <ColorPickerIcon class="tool__item-svg" />
        <ul v-if="showColorPicker" class="color-bar">
          <li>
            <button
              class="color-button"
              style="background-color: rgba(10, 10, 10, 1)"
              @click="setColor('rgba(10, 10, 10, 1)')"
            />
          </li>
          <li>
            <button
              class="color-button"
              style="background-color: rgba(38, 51, 104, 1)"
              @click="setColor('rgba(38, 51, 104, 1)')"
            />
          </li>
          <li>
            <button
              class="color-button"
              style="background-color: rgba(244, 71, 71, 1)"
              @click="setColor('rgba(244, 71, 71, 1)')"
            />
          </li>
          <li>
            <button
              class="color-button"
              style="background-color: rgba(255, 208, 115, 0.6)"
              @click="setColor('rgba(255, 208, 115, 0.6)')"
            />
          </li>
          <li>
            <button
              class="color-button"
              style="background-color: rgba(22, 210, 170, 0.6)"
              @click="setColor('rgba(22, 210, 170, 0.6)')"
            />
          </li>
          <li>
            <button
              class="color-button"
              style="background-color: rgba(24, 85, 209, 0.6)"
              @click="setColor('rgba(24, 85, 209, 0.6)')"
            />
          </li>
        </ul>
      </li>
      <li class="tool__item" @click="undo">
        <UndoIcon class="tool__item-svg" />
      </li>
      <li class="tool__item" @click="redo">
        <RedoIcon class="tool__item-svg" />
      </li>
      <li class="tool__item" @click="clearWhiteboard">
        <ClearIcon class="tool__item-svg" />
      </li>
    </ul>
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

ul#toolbar {
  list-style-type: none;
  padding-left: 0;
  width: 400px;
  height: 80px;
  position: absolute;
  bottom: 60px;
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
    background: #ddd;
  }

  &-color-picker {
    position: relative;
  }

  &-svg {
    width: 20px;
  }

  &-delete {
    fill: #b55050;
  }
}

.selected-tool {
  background-color: #ddd;
}

.color-button {
  margin: 10px 2px;
  height: 17px;
  border-radius: 10px;
}

.color-bar {
  position: absolute;
  left: 0;
  bottom: 60px;
  list-style-type: none;
  display: flex;
  justify-content: space-around;
  background-color: #fff;
  border: 1px solid #979797;
  border-radius: 5px;
  padding-left: 0; // override default ul padding
  padding: 0.2em 0.4em;
  width: 150px;
}
</style>
