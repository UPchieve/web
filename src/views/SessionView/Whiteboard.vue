<template>
  <div class="zwib-wrapper">
    <div id="zwib-div"></div>
    <ul id="toolbar">
      <li
        class="tool__item"
        v-bind:class="selectedTool === 'pick' ? 'selected-tool' : ''"
        @click="usePickTool"
      >
        <SelectionIcon class="tool__item-svg" />
      </li>
      <li class="tool__item" @click="clearWhiteboard">
        <ClearIcon class="tool__item-svg" />
      </li>
      <li class="tool__item tool__item-color-picker" @click="toggleColorPicker">
        <ColorPickerIcon class="tool__item-svg" />
        <ul v-if="showColorPicker" class="color-bar">
          <li>
            <button
              class="color-button"
              style="background-color: rgba(52, 52, 64, 0.6)"
              @click="setColor('rgba(52, 52, 64, 0.6)')"
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
      <li
        class="tool__item"
        v-bind:class="selectedTool === 'pen' ? 'selected-tool' : ''"
        @click="useBrushTool"
      >
        <PenIcon class="tool__item-svg" />
      </li>
      <li class="tool__item" @click="undo">
        <UndoIcon class="tool__item-svg" />
      </li>
      <li class="tool__item" @click="redo">
        <RedoIcon class="tool__item-svg" />
      </li>
    </ul>
  </div>
</template>

<script>
import SelectionIcon from "@/assets/whiteboard_icons/selection.svg";
import ClearIcon from "@/assets/whiteboard_icons/clear.svg";
import ColorPickerIcon from "@/assets/whiteboard_icons/color_picker.svg";
import PenIcon from "@/assets/whiteboard_icons/pen.svg";
import UndoIcon from "@/assets/whiteboard_icons/undo.svg";
import RedoIcon from "@/assets/whiteboard_icons/redo.svg";

export default {
  data() {
    return {
      zwibbler: null,
      selectedTool: "pen",
      showColorPicker: false
    };
  },
  components: {
    SelectionIcon,
    ClearIcon,
    ColorPickerIcon,
    PenIcon,
    UndoIcon,
    RedoIcon
  },
  mounted() {
    const zwibblerCtx = window.Zwibbler.create("zwib-div", {
      showToolbar: false,
      showColourPanel: false,
      collaborationServer: "ws://localhost:3000/socket/{name}"
    });

    this.zwibblerCtx = zwibblerCtx;

    const roomIdParam = this.$route.params.sessionId || "";
    const roomId = zwibblerCtx.createSharedSession(roomIdParam);
    this.useBrushTool();
    console.log("Room ID:", roomId);
  },
  methods: {
    usePickTool() {
      this.zwibblerCtx.usePickTool();
      this.selectedTool = "pick";
      this.showColorPicker = false;
    },
    clearWhiteboard() {
      this.zwibblerCtx.newDocument();
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
    setColor(color) {
      // Second parameter indicates whether the colour should affect the fill or outline colour.
      const useFill = true;
      this.zwibblerCtx.setColour(color, useFill);
    }
  }
};
</script>

<style lang="scss">
.zwib-wrapper {
  margin: 20px;
  height: 100%;
  width: 100%;
}

#zwib-div {
  margin: 10px;
  height: 100%;
  width: 100%;
}

#toolbar {
  background-color: rgb(238, 238, 238);
  margin: 0;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  position: fixed;
  bottom: 20px;
  border-radius: 8px;
  list-style-type: none;
  left: 20px;
  width: 400px;
  padding-left: 0;
}

.tool__item {
  padding: 1em;
  border: 1px solid transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;

  &:hover {
    border: 1px solid blue;
  }

  &-color-picker {
    position: relative;
  }

  &-svg {
    width: 20px;
  }
}

.selected-tool {
  background-color: #65b965;
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
