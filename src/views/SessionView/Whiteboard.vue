<template>
  <div class="whiteboard" id="whiteboard">
    <canvas
      v-canvas
      id="whiteboardCanvas"
      @mousedown="drawStart"
      @mouseup="drawEnd"
      @mousemove="draw"
      v-touch:start="drawStart"
      v-touch:end="drawEnd"
      v-touch:moving="draw"
      width="1280"
      height="800"
    />
    <div
      class="whiteboardTools row"
      style="background-color:rgba(238,238,238,1)"
    >
      <div class="header">Whiteboard Tools</div>
      <div class="toolset col-md-6">
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

            <textarea
              id="textInputBox"
              rows="4"
              cols="50"
              style="visibility:hidden"
              placeholder="Type Here"
              @input="textBox"
              @keydown="keydown"
              @keyup.enter="hideBox"
            />
          </div>
        </div>
        <button id="drawButton" class="whiteboardBtn" @click="drawSetup" />
        <button id="eraseButton" class="whiteboardBtn" @click="erase" />
        <button id="undoButton" class="whiteboardBtn" @click="undo" />
        <!-- <button class='whiteboardBtn' id='textButton' v-on:click="text"></button> -->
      </div>
    </div>
  </div>
</template>

<script>
/**
 * @todo {0} This component needs a lot of refactoring
 * @todo {1} Solve this bug ('handleUndoOperation' is not defined)
 */

import SessionService from "@/services/SessionService";
import UserService from "@/services/UserService";
import EraserIconUrl from "@/assets/eraser_icon_01_dark.png";
import PenIconUrl from "@/assets/pen_icon_01_dark.png";

// const CLEAR_BUTTON_ID = 'clearButton';
// const UNDO_BUTTON_ID = 'undoButton';
// const ERASE_BUTTON_ID = 'eraseButton';
// const DRAW_BUTTON_ID = 'drawButton';
// const TEXT_BUTTON_ID = 'textButton';
// const TEXT_AREA_ID = 'textInputBox';

// const CANVAS_WIDTH = 800;
// const CANVAS_HEIGHT = 400;

// const LINE_FILL_STYLE = 'solid';
let LOCAL_LINE_COLOR = "rgba(52,52,64,.6)";
let SERVER_LINE_COLOR = "rgba(52,52,64,.6)";
let SERVER_LINE_WIDTH = 5;
const LINE_WIDTH = 5;
// const LINE_CAP = 'round';

const ERASING_LINE_COLOR = "white";
const ERASING_LINE_WIDTH = 20;

// const DRAWING = false;

let SERVER_DRAWING = false;

const ERASER_ICON = `url("${EraserIconUrl}") 0 50, auto`;
const PEN_ICON = `url("${PenIconUrl}") 0 50, auto`;
const TEXT_ICON = "text";

let TEXT_POSITION_X = 10;
let TEXT_POSITION_Y = 10;

// const ERASING = false;
// let INSERTING_TEXT = false;
let CURSOR_VISIBLE = false;
// let CURSOR_REMOVED = false;

let currentState = "";

let imageList = [];
let imageData;
window.App = {};
const App = window.App;

// const RESET_SCREEN_EVENT = 'reset';

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
      showColors: "hidden",
      canvasHeight: null,
    };
  },
  mounted() {
    const canvas = document.getElementById('whiteboardCanvas');
    const whiteboard = document.getElementById('whiteboard');

    // Determime and emit height of whiteboard container
    this.canvasHeight = whiteboard.offsetHeight; 
    if (localStorage.sessionCanvasHeight) {
      canvas.height = localStorage.sessionCanvasHeight;
      canvas.width = localStorage.sessionCanvasHeight * 1.33; 
    } else {
      canvas.height = this.canvasHeight;
      canvas.width = this.canvasHeight * 1.33;  
    }
    if (this.isMobile()) {
      alert('hello mobile');
    }

    this.emitCanvasLoaded();
    this.resizeCanvas();
    this.drawSetup();
    window.addEventListener("resize", this.resizeCanvas);
  },
  methods: {
    isMobile() {
      // Check if browser is mobile (can be moved into a file for future use)
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
        return true;
      } else {
        return false;
      }
    },
    resizeCanvas() {
      const savedImage = App.ctx.getImageData(
        0,
        0,
        App.canvas.width,
        App.canvas.height
      );
      App.ctx.putImageData(savedImage, 0, 0);
    },

    // Socket emits
    emitCanvasLoaded() {
      this.$socket.emit("canvasLoaded", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        height: this.canvasHeight
      });
    },
    emitDrawClick() {
      this.$socket.emit("drawClick", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser()
      });
    },
    emitSaveImage() {
      this.$socket.emit("saveImage", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser()
      });
    },
    emitUndoClick() {
      this.$socket.emit("undoClick", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser()
      });
    },
    emitClearClick() {
      this.$socket.emit("clearClick", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser()
      });
    },
    emitChangeColor(color) {
      this.$socket.emit("changeColor", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        color
      });
    },
    emitChangeWidth(width) {
      this.$socket.emit("changeWidth", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        width
      });
    },
    emitDrawing() {
      this.$socket.emit("drawing", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser()
      });
    },
    emitEnd() {
      this.$socket.emit("end", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        whiteboardUrl: App.canvas.toDataURL()
      });
    },
    emitDragStart(data) {
      this.$socket.emit("dragStart", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        x: data.x,
        y: data.y,
        color: data.color
      });
    },
    emitDragAction(data) {
      this.$socket.emit("dragAction", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        x: data.x,
        y: data.y,
        color: data.color
      });
    },
    emitDragEnd(data) {
      this.$socket.emit("dragEnd", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        x: data.x,
        y: data.y,
        color: data.color
      });
    },
    emitInsertText(data) {
      this.$socket.emit("insertText", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        x: data.x,
        y: data.y,
        text: data.text
      });
    },
    emitResetScreen(/* data */) {
      this.$socket.emit("resetScreen", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser()
      });
    },

    // UI events

    hideBox() {
      this.$el.querySelector("#textInputBox").style.visibility = "hidden";
      this.$el.querySelector("#textInputBox").value = "";
      currentState = "";
    },
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
    drawStart(event) {
      if (!SERVER_DRAWING) {
        this.emitDrawing();
        if (!CURSOR_VISIBLE && currentState === "INSERTING_TEXT") {
          TEXT_POSITION_X = event.layerX - 10;
          TEXT_POSITION_Y = event.layerY + 34;
          CURSOR_VISIBLE = true;
          saveImage(App.canvas, App.ctx);
          this.emitSaveImage();
          if (imageList.length > 0) {
            imageData = imageList[imageList.length - 1];
            App.ctx.putImageData(imageData, 0, 0);
          } else {
            imageData = App.ctx.getImageData(
              0,
              0,
              App.canvas.width,
              App.canvas.height
            );
          }

          imageList.push(imageData);
          App.ctx.fillText("|", TEXT_POSITION_X, TEXT_POSITION_Y);
          this.emitInsertText({
            text: "|",
            x: TEXT_POSITION_X,
            y: TEXT_POSITION_Y
          });
          // CURSOR_REMOVED = false;
        } else if (currentState === "DRAWING" || currentState === "ERASING") {
          saveImage(App.canvas, App.ctx);
          this.emitSaveImage();
          App.canvas.isDrawing = true;

          var x = event.pageX;
          var y = event.pageY;
          const whiteboard = document.getElementById('whiteboard');

          this.fillCircle(
            App.canvas,
            App.ctx,
            "dragstart",
            false,
            x,
            y,
            LOCAL_LINE_COLOR
          );

          x += whiteboard.scrollLeft;
          y += whiteboard.scrollTop;
          this.emitDragStart({
            x,
            y,
            color: LOCAL_LINE_COLOR
          });
        }
      }
    },
    drawEnd(event) {
      if (!SERVER_DRAWING) {
        App.canvas.isDrawing = false;

        var x = event.pageX;
        var y = event.pageY;
        const whiteboard = document.getElementById('whiteboard');

        this.fillCircle(
          App.canvas,
          App.ctx,
          "dragend",
          false,
          x,
          y,
          LOCAL_LINE_COLOR
        );

        x += whiteboard.scrollLeft;
        y += whiteboard.scrollTop;
        this.emitDragEnd({
          x,
          y,
          color: LOCAL_LINE_COLOR
        });
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
        this.emitEnd();
      }
    },
    draw(event) {
      if (!SERVER_DRAWING) {
        if (currentState === "DRAWING" || currentState === "ERASING") {
          if (!App.canvas.isDrawing) {
            return;
          }

          var x = event.pageX;
          var y = event.pageY;
          const whiteboard = document.getElementById('whiteboard');

          this.fillCircle(
            App.canvas,
            App.ctx,
            "drag",
            false,
            x,
            y,
            LOCAL_LINE_COLOR
          );

          x += whiteboard.scrollLeft;
          y += whiteboard.scrollTop;
          this.emitDragAction({
            x,
            y,
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

      this.$el.querySelector("#textInputBox").value = "";
      this.$el.querySelector("#textInputBox").style.visibility = "hidden";
      App.canvas.style.cursor = PEN_ICON;

      if (currentState === "INSERTING_TEXT") {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }

      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }

      currentState = "DRAWING";
    },

    keydown(e) {
      if (
        this.$el.querySelector("#textInputBox").value === "" &&
        e.keyCode !== 8 &&
        e.keyCode !== 46
      ) {
        if (imageList.length > 0) {
          imageData = imageList.pop();
          App.ctx.putImageData(imageData, 0, 0);
        }
      }
    },

    text() {
      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }
      saveImage(App.canvas, App.ctx);
      this.emitSaveImage();

      currentState = "INSERTING_TEXT";
      // INSERTING_TEXT = true;
      CURSOR_VISIBLE = false;
      App.canvas.style.cursor = TEXT_ICON;
      this.$el.querySelector("#textInputBox").style.visibility = "visible";
      this.$el.querySelector("#textInputBox").value = "";
    },

    textBox() {
      if (CURSOR_VISIBLE) {
        // handleUndoOperation(); // {1}
        this.emitUndoClick();
        CURSOR_VISIBLE = false;
      }
      this.insertText(
        this.$el.querySelector("#whiteboardCanvas"),
        this.$el.querySelector("#textInputBox").value
      );
      this.emitInsertText({
        text: this.$el.querySelector("#textInputBox").value,
        x: TEXT_POSITION_X,
        y: TEXT_POSITION_Y
      });
    },

    undo() {
      const currentImage = App.ctx.getImageData(
        0,
        0,
        App.canvas.width,
        App.canvas.height
      );
      this.$el.querySelector("#textInputBox").value = "";
      if (imageList.length > 0) {
        imageData = imageList.pop();
        while (compareImages(currentImage, imageData)) {
          imageData = imageList.pop();
        }
        if (imageData !== null) {
          App.ctx.putImageData(imageData, 0, 0);
        }

        this.emitUndoClick();
      }
    },

    erase() {
      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }
      if (currentState === "INSERTING_TEXT") {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }
      currentState = "ERASING";
      App.ctx.strokeStyle = ERASING_LINE_COLOR;
      App.ctx.lineWidth = ERASING_LINE_WIDTH;
      App.canvas.style.cursor = ERASER_ICON;
      this.$el.querySelector("#textInputBox").value = "";
      this.$el.querySelector("#textInputBox").style.visibility = "hidden";
      this.emitChangeColor(ERASING_LINE_COLOR);
      this.emitChangeWidth(ERASING_LINE_WIDTH);
    },

    // Canvas manipulations
    fillCircle(canvas, context, type, server, x, y) {
      const scrollLeft =
        window.pageXOffset !== undefined
          ? window.pageXOffset
          : (
              document.documentElement ||
              document.body.parentNode ||
              document.body
            ).scrollLeft;

      const scrollTop =
        window.pageYOffset !== undefined
          ? window.pageYOffset
          : (
              document.documentElement ||
              document.body.parentNode ||
              document.body
            ).scrollTop;

      const rect = App.canvas.getBoundingClientRect();

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
          context.moveTo(
            x - scrollLeft - rect.left,
            y - scrollTop - rect.top 
          );
        } else if (type === "drag") {
          context.lineTo(
            x - scrollLeft - rect.left,
            y - scrollTop - rect.top
          );
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
    insertText(canvas, input) {
      App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);

      if (imageList.length > 0) {
        imageData = imageList.pop();
        App.ctx.putImageData(imageData, 0, 0);
        imageList.push(imageData);
      }
      App.ctx.fillText(input, TEXT_POSITION_X, TEXT_POSITION_Y);
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
    "session-change"() {
      this.emitCanvasLoaded();      
    },
    size(data) {
      // Receives broadcast of other user's screen size and resizes (or not) accordingly
      const targetHeight = data.height;
      if (targetHeight > this.canvasHeight) {
        // Resize canvas and save dimensions to localstorage
        const canvas = document.getElementById('whiteboardCanvas');
        canvas.height = targetHeight;  
        canvas.width = targetHeight * 1.33;
        localStorage.sessionCanvasHeight = targetHeight;
      } else {
        localStorage.sessionCanvasHeight = this.canvasHeight;
      }

    },
    dstart(data) {
      const whiteboard = document.getElementById('whiteboard');
      this.fillCircle(
        App.canvas,
        App.ctx,
        "dragstart",
        true,
        data.x - whiteboard.scrollLeft,
        data.y - whiteboard.scrollTop,
        data.color
      );
    },
    drag(data) {
      const whiteboard = document.getElementById('whiteboard');
      this.fillCircle(
        App.canvas,
        App.ctx,
        "drag",
        true,
        data.x - whiteboard.scrollLeft,
        data.y - whiteboard.scrollTop,
        data.color
      );
    },
    dend(data) {
      const whiteboard = document.getElementById('whiteboard');
      this.fillCircle(
        App.canvas,
        App.ctx,
        "dragend",
        true,
        data.x - whiteboard.scrollLeft,
        data.y - whiteboard.scrollTop,
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
      const currentImage = App.ctx.getImageData(
        0,
        0,
        App.canvas.width,
        App.canvas.height
      );
      if (imageList.length > 0) {
        imageData = imageList.pop();
        while (compareImages(currentImage, imageData)) {
          imageData = imageList.pop();
        }
        if (imageData !== null) {
          App.ctx.putImageData(imageData, 0, 0);
        }
      }
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
    },
    text(data) {
      App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);

      if (imageList.length > 0) {
        imageData = imageList.pop();
        App.ctx.putImageData(imageData, 0, 0);
        imageList.push(imageData);
      }
      App.ctx.fillText(data.text, data.x, data.y);
    }
  }
};
</script>

<style lang="scss" scoped>
.whiteboard {
  height: 100%;
  overflow: scroll;
  flex-direction: column;
}

canvas {
  background: #fff;
  display: block;
  overflow: scroll;
  cursor: not-allowed;
}

.whiteboardTools {
  padding: 10px 30px;
  width: 300px;
  height: 80px;
  display: flex;
  align-items: center;
  align-self: center;
  flex-direction: column;
  position: absolute;
  bottom: 0;
}

.header {
  font-size: 12px;
}

.toolset {
  display: flex;
  justify-content: center;
  padding-top: 5px;
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
  padding: 13px;
  border: none;
  margin: 4px;
  background-repeat: no-repeat;
  background-position: center;
  background-color: rgb(238, 238, 238);
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

#textButton {
  background-image: url("~@/assets/Aa.png");
}

#clearButton {
  background-image: url("~@/assets/clear_icon.svg");
}

#openColorsButton {
  background-image: url("~@/assets/color_icon.svg");
}
</style>
