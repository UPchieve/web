<template>
  <div class="whiteboard" id="whiteboard">
    <div class="canvas-wrapper" id="canvas-wrapper">
      <canvas
        v-canvas
        id="whiteboardCanvas"
        @mousedown="drawStart"
        @mousemove="draw"
        @mouseup="drawEnd"
        @mouseleave="handleMouseLeave"
        width="1600"
        height="1200"
      />
    </div>
    <div
      class="whiteboardTools row"
      style="background-color:rgba(238,238,238,1)"
    >
      <div v-if="mobileMode" class="mobile-whiteboard-notice">
        Whiteboard drawing is not supported on this device.
      </div>
      <div v-else class="toolset col-md-6">
        <button id="clearButton" class="whiteboardBtn" @click="clear" />
        <div class="colorWrapper">
          <button
            id="openColorsButton"
            class="whiteboardBtn"
            @click="openColors"
          />
          <div
            :style="{ visibility: showColors }"
            class="toolset col-md-6 colorContainer"
          >
            <button
              class="colorButton greyBtn"
              style="background-color: rgba(52,52,64,.6)"
              @click="changeColor"
            />
            <button
              class="colorButton navyBtn"
              style="background-color: rgba(38,51,104,1)"
              @click="changeColor"
            />
            <button
              class="colorButton redBtn"
              style="background-color: rgba(244,71,71,1)"
              @click="changeColor"
            />
            <button
              class="colorButton yellowBtn"
              style="background-color: rgba(255,208,115,.6)"
              @click="changeColor"
            />
            <button
              class="colorButton greenBtn"
              style="background-color: rgba(22,210,170,.6)"
              @click="changeColor"
            />
            <button
              class="colorButton blueBtn"
              style="background-color: rgba(24,85,209,.6)"
              @click="changeColor"
            />
          </div>
        </div>
        <button id="drawButton" class="whiteboardBtn" @click="drawSetup" />
        <button id="eraseButton" class="whiteboardBtn" @click="erase" />
        <button id="undoButton" class="whiteboardBtn" @click="undo" />
      </div>
    </div>
  </div>
</template>

<script>
/**
 * @todo {0} This component needs a lot of refactoring
 * @todo {1} Solve this bug ('handleUndoOperation' is not defined)
 */

import { mapState, mapGetters } from "vuex";

import SessionService from "@/services/SessionService";
import EraserIconUrl from "@/assets/eraser_icon_01_dark.png";
import PenIconUrl from "@/assets/pen_icon_01_dark.png";

let LOCAL_LINE_COLOR = "rgba(52,52,64,.6)";
let SERVER_LINE_COLOR = "rgba(52,52,64,.6)";
let SERVER_LINE_WIDTH = 5;
const LINE_WIDTH = 5;

const ERASING_LINE_COLOR = "white";
const ERASING_LINE_WIDTH = 20;

let SERVER_DRAWING = false;

const ERASER_ICON = `url("${EraserIconUrl}") 0 50, auto`;
const PEN_ICON = `url("${PenIconUrl}") 0 50, auto`;

let currentState = "";

let imageList = [];
let imageData;
window.App = {};
const App = window.App;

function compareImages(img1, img2) {
  if (img1 !== null && img2 !== null) {
    if (img1.data.length !== img2.data.length) {
      return false;
    }
    for (let i = 0; i < img1.data.length; ++i) {
      if (img1.data[i] !== img2.data[i]) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function saveImage(canvas, ctx) {
  imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  imageList.push(imageData);

function undoChange(App) {
  const currentImage = App.ctx.getImageData(
    0,
    0,
    App.canvas.width,
    App.canvas.height
  );

  if (imageList.length > 1) {
    imageData = imageList.pop();
    while (compareImages(currentImage, imageData)) {
      imageData = imageList.pop();
    }
    if (imageData !== null) {
      App.ctx.putImageData(imageData, 0, 0);

      // Since this image was unique, add it back to the list
      imageList.push(imageData);
    }
  }
}

export default {
  directives: {
    canvas(el) {
      App.canvas = el;
      App.ctx = el.getContext("2d");
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      // this.emitChangeColor(LOCAL_LINE_COLOR);
      App.ctx.lineWidth = LINE_WIDTH;
      App.ctx.font = "bold 64px Arial";
      saveImage(App.canvas, App.ctx);
    }
  },
  data() {
    return {
      currentSession: SessionService.currentSession,
      showColors: "hidden"
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode"
    })
  },
  mounted() {
    this.drawSetup();
  },
  methods: {
    emitDrawClick() {
      this.$socket.emit("drawClick", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id }
      });
    },
    emitSaveImage() {
      this.$socket.emit("saveImage", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id }
      });
    },
    emitUndoClick() {
      this.$socket.emit("undoClick", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id }
      });
    },
    emitClearClick() {
      this.$socket.emit("clearClick", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id }
      });
    },
    emitChangeColor(color) {
      this.$socket.emit("changeColor", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id },
        color
      });
    },
    emitChangeWidth(width) {
      this.$socket.emit("changeWidth", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id },
        width
      });
    },
    emitDrawing() {
      this.$socket.emit("drawing", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id }
      });
    },
    emitEnd() {
      this.$socket.emit("end", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id },
        whiteboardUrl: App.canvas.toDataURL()
      });
    },
    emitDragStart(data) {
      this.$socket.emit("dragStart", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id },
        x: data.x,
        y: data.y,
        color: data.color
      });
    },
    emitDragAction(data) {
      this.$socket.emit("dragAction", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id },
        x: data.x,
        y: data.y,
        color: data.color
      });
    },
    emitDragEnd(data) {
      this.$socket.emit("dragEnd", {
        sessionId: this.currentSession.sessionId,
        user: { _id: this.user._id },
        x: data.x,
        y: data.y,
        color: data.color
      });
    },

    // UI events
    changeColor(event) {
      if (currentState === "DRAWING") {
        LOCAL_LINE_COLOR = event.target.style.backgroundColor;
        App.ctx.strokeStyle = LOCAL_LINE_COLOR;
        this.emitChangeColor(LOCAL_LINE_COLOR);
        App.ctx.lineWidth = LINE_WIDTH;
        this.emitChangeWidth(LINE_WIDTH);
      } else if (currentState === "ERASING") {
        App.ctx.strokeStyle = ERASING_LINE_COLOR;
        App.ctx.lineWidth = ERASING_LINE_WIDTH;
      }
    },
    clear() {
      App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
      imageList = [];
      saveImage(App.canvas, App.ctx);
      this.emitClearClick();
    },
    handleMouseLeave(event) {
      if (App.canvas.isDrawing) {
        this.drawEnd(event);
      }
    },
    drawStart(event) {
      if (this.mobileMode) {
        return;
      }

      if (!SERVER_DRAWING) {
        this.emitDrawing();

        if (currentState === "DRAWING" || currentState === "ERASING") {
          saveImage(App.canvas, App.ctx);
          this.emitSaveImage();
          App.canvas.isDrawing = true;

          let x = event.pageX;
          let y = event.pageY;

          if (this.mobileMode && event.touches && event.touches.length) {
            const touchEvent = event.touches[0];
            x = touchEvent.clientX;
            y = touchEvent.clientY;
          }

          const whiteboard = document.getElementById("canvas-wrapper");
          const canvasRect = whiteboard.getBoundingClientRect();

          const canvasOffsetX = canvasRect.left;
          const canvasOffsetY = canvasRect.top;

          const transmitX =
            x - canvasOffsetX + whiteboard.scrollLeft - window.scrollX;
          const transmitY =
            y - canvasOffsetY + whiteboard.scrollTop - window.scrollY;

          this.fillCircle(
            App.canvas,
            App.ctx,
            "dragstart",
            false,
            transmitX,
            transmitY,
            LOCAL_LINE_COLOR
          );

          this.emitDragStart({
            x: transmitX,
            y: transmitY,
            color: LOCAL_LINE_COLOR
          });
        }
      }
    },
    drawEnd(event) {
      if (this.mobileMode) {
        return;
      }

      if (!SERVER_DRAWING) {
        App.canvas.isDrawing = false;

        let x = event.pageX;
        let y = event.pageY;

        if (this.mobileMode && event.touches && event.touches.length) {
          const touchEvent = event.touches[0];
          x = touchEvent.clientX;
          y = touchEvent.clientY;
        }

        const whiteboard = document.getElementById("canvas-wrapper");
        const canvasRect = whiteboard.getBoundingClientRect();

        const canvasOffsetX = canvasRect.left;
        const canvasOffsetY = canvasRect.top;

        const transmitX =
          x - canvasOffsetX + whiteboard.scrollLeft - window.scrollX;
        const transmitY =
          y - canvasOffsetY + whiteboard.scrollTop - window.scrollY;

        this.fillCircle(
          App.canvas,
          App.ctx,
          "dragend",
          false,
          transmitX,
          transmitY,
          LOCAL_LINE_COLOR
        );

        this.emitDragEnd({
          x: transmitX,
          y: transmitY,
          color: LOCAL_LINE_COLOR
        });

        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
        this.emitEnd();
      }
    },
    draw(event) {
      if (this.mobileMode) {
        return;
      }

      if (!SERVER_DRAWING) {
        if (currentState === "DRAWING" || currentState === "ERASING") {
          if (!App.canvas.isDrawing) {
            return;
          }

          const whiteboard = document.getElementById("canvas-wrapper");
          const canvasRect = whiteboard.getBoundingClientRect();

          let x = event.pageX;
          let y = event.pageY;

          if (this.mobileMode && event.touches && event.touches.length) {
            const touchEvent = event.touches[0];
            x = touchEvent.clientX;
            y = touchEvent.clientY;
          }

          const canvasOffsetX = canvasRect.left;
          const canvasOffsetY = canvasRect.top;

          const transmitX =
            x - canvasOffsetX + whiteboard.scrollLeft - window.scrollX;
          const transmitY =
            y - canvasOffsetY + whiteboard.scrollTop - window.scrollY;

          this.fillCircle(
            App.canvas,
            App.ctx,
            "drag",
            false,
            transmitX,
            transmitY,
            LOCAL_LINE_COLOR
          );

          this.emitDragAction({
            x: transmitX,
            y: transmitY,
            color: LOCAL_LINE_COLOR
          });
        }
      }
    },
    drawSetup() {
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      this.emitChangeColor(LOCAL_LINE_COLOR);
      App.ctx.lineWidth = LINE_WIDTH;
      this.emitChangeWidth(LINE_WIDTH);

      App.canvas.style.cursor = PEN_ICON;

      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }

      currentState = "DRAWING";
    },

    undo() {
      undoChange(App);
      this.emitUndoClick();
    },

    erase() {
      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }

      currentState = "ERASING";
      App.ctx.strokeStyle = ERASING_LINE_COLOR;
      App.ctx.lineWidth = ERASING_LINE_WIDTH;
      App.canvas.style.cursor = ERASER_ICON;
      this.emitChangeColor(ERASING_LINE_COLOR);
      this.emitChangeWidth(ERASING_LINE_WIDTH);
    },

    // Canvas manipulations
    fillCircle(canvas, context, type, server, x, y) {
      if (server) {
        App.ctx.strokeStyle = SERVER_LINE_COLOR;
        App.ctx.lineWidth = SERVER_LINE_WIDTH;
      } else if (currentState === "ERASING") {
        App.ctx.strokeStyle = ERASING_LINE_COLOR;
        App.ctx.lineWidth = ERASING_LINE_WIDTH;
      }
      if (currentState === "DRAWING" || currentState === "ERASING" || server) {
        if (type === "dragstart") {
          if (imageList.length > 0) {
            imageData = imageList[imageList.length - 1];
            context.putImageData(imageData, 0, 0);
          }

          context.beginPath();
          context.moveTo(x, y);
        } else if (type === "drag") {
          context.lineTo(x, y);
          context.stroke();
        } else {
          context.closePath();
          saveImage(canvas, context);
          this.emitSaveImage();
        }
        if (server) {
          App.ctx.strokeStyle = LOCAL_LINE_COLOR;
          App.ctx.lineWidth = LINE_WIDTH;
        }
      }
    },

    openColors() {
      if (this.showColors === "hidden") {
        this.showColors = "visible";
      } else {
        this.showColors = "hidden";
      }
    }
  },
  sockets: {
    dstart(data) {
      this.fillCircle(
        App.canvas,
        App.ctx,
        "dragstart",
        true,
        data.x,
        data.y,
        data.color
      );
    },
    drag(data) {
      this.fillCircle(
        App.canvas,
        App.ctx,
        "drag",
        true,
        data.x,
        data.y,
        data.color
      );
    },
    dend(data) {
      this.fillCircle(
        App.canvas,
        App.ctx,
        "dragend",
        true,
        data.x,
        data.y,
        data.color
      );
    },
    draw() {
      SERVER_DRAWING = true;
    },
    end() {
      SERVER_DRAWING = false;
    },
    save() {
      const imageData = App.ctx.getImageData(
        0,
        0,
        App.canvas.width,
        App.canvas.height
      );
      imageList.push(imageData);
    },
    undo() {
      undoChange(App);
    },
    clear() {
      App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
      imageList = [];
      saveImage(App.canvas, App.ctx);
    },
    color(newColor) {
      SERVER_LINE_COLOR = newColor;
    },
    width(newWidth) {
      SERVER_LINE_WIDTH = newWidth;
    }
  }
};
</script>

<style lang="scss" scoped>
.whiteboard {
  height: 100%;
  position: relative;
  overflow: hidden;
}

.canvas-wrapper {
  height: 100%;
  overflow: scroll;
}

canvas {
  background: #fff;
  display: block;
  cursor: not-allowed;
}

.whiteboardTools {
  padding: 10px 30px;
  width: 100%;
  margin: 0;
  width: 300px;
  height: 80px;
  display: flex;
  align-items: center;
  flex-direction: column;
  position: fixed;
  bottom: 20px;
  border-radius: 8px;
  left: 50%;
  transform: translate(-50%, 0);

  @include breakpoint-above("medium") {
    position: absolute;
  }

  .mobile-whiteboard-notice {
    margin: auto;
  }
}

.header {
  font-size: 12px;
  display: block;
}

.toolset {
  display: flex;
  justify-content: center;
  padding-top: 8px;
}

.colorContainer {
  position: absolute;
  bottom: 85%;
  height: 30px;
  width: 130px;
  padding: 0px 10px 0px 15px;
  border: 1px solid #979797;
  background-color: #fff;
  border-radius: 5px;
  z-index: 1;
  align-items: center;
}

.whiteboardBtn {
  padding: 20px;
  border: none;
  margin: 3px;
  border-radius: 8px;
  background-repeat: no-repeat;
  background-position: center;
  background-color: rgb(238, 238, 238);
  transition: 0.2s;
}

.colorButton {
  margin: 10px 2px;
  height: 17px;
  border-radius: 10px;
}

#eraseButton {
  background-image: url("~@/assets/eraser_icon.svg");
}

#drawButton {
  background-image: url("~@/assets/pen_icon.svg");
}

#undoButton {
  background-image: url("~@/assets/undo_icon.svg");
}

#clearButton {
  background-image: url("~@/assets/clear_icon.svg");
  padding: 13px;
  margin: 10px 8px 10px 10px;
  width: 0;
  height: 0;
}

#openColorsButton {
  background-image: url("~@/assets/color_icon.svg");
}
</style>
