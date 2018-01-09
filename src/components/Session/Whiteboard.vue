<template>
  <div class="whiteboard">
      <canvas id='whiteboardCanvas' v-canvas v-on:mousedown="drawStart" v-on:mouseup="drawEnd" v-on:mousemove="draw"></canvas>
      <div class="whiteboardTools row" style="background-color:rgba(238,238,238,1)">
        <div class="toolset col-md-6">
          <button class='whiteboardBtn' id='drawButton' v-on:click="drawSetup"></button>
          <button class='whiteboardBtn' id='eraseButton' v-on:click="erase"></button>
          <button class='whiteboardBtn' id='undoButton' v-on:click="undo"></button>
          <!-- <button id='textButton' v-on:click="text"></button> -->
          <button class='whiteboardBtn' id='clearButton' v-on:click="clear" ></button>
          <div>
            <button class='whiteboardBtn' id='openColorsButton' v-on:click="openColors" ></button>
            <div class="toolset col-md-6 colorContainer" v-if="showColors">
              <button class='colorButton whiteboardBtn' v-on:click="changeColor" style='background-color:rgba(244,71,71,1);'></button>
              <button class='colorButton whiteboardBtn' v-on:click="changeColor" style='background-color:rgba(255,208,115,.6);'></button>
              <button class='colorButton whiteboardBtn' v-on:click="changeColor"  style='background-color:rgba(22,210,170,.6);'></button>
              <button class='colorButton whiteboardBtn' v-on:click="changeColor"  style='background-color:rgba(24,85,209,.6);'></button>
              <button class='colorButton whiteboardBtn' v-on:click="changeColor"  style='background-color:rgba(52,52,64,.6);'></button>
              <button class='colorButton whiteboardBtn' v-on:click="changeColor"  style='background-color:rgba(38,51,104,1);'></button>


              <textarea id='textInputBox' v-on:input="textBox" v-on:keydown="keydown" v-on:keyup.enter="hideBox" rows='4' cols='50' style='visibility:hidden' placeholder='Type Here'></textarea>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script>
import $ from 'jquery'

import AuthService from 'src/services/AuthService'
import SessionService from 'src/services/SessionService'

var CLEAR_BUTTON_ID = 'clearButton';
var UNDO_BUTTON_ID = 'undoButton';
var ERASE_BUTTON_ID = 'eraseButton';
var DRAW_BUTTON_ID = 'drawButton';
var TEXT_BUTTON_ID = 'textButton';
var TEXT_AREA_ID = 'textInputBox'



var CANVAS_WIDTH = 800;
var CANVAS_HEIGHT = 400;

var LINE_FILL_STYLE = 'solid';
var LOCAL_LINE_COLOR = 'rgba(244,71,71,1)';
var SERVER_LINE_COLOR = 'rgba(244,71,71,1)';
var SERVER_LINE_WIDTH = 5;
var LINE_WIDTH = 5;
var LINE_CAP = 'round';


var ERASING_LINE_COLOR = 'white';
var ERASING_LINE_WIDTH = 20;

var DRAWING = false;

var SERVER_DRAWING = false;



var ERASER_ICON = 'url(\'/static/eraser_icon_01_dark.png\') 0 50, auto';
var PEN_ICON = 'url(\"/static/pen_icon_01_dark.png\") 0 50, auto';
var TEXT_ICON = 'text';



var TEXT_POSITION_X = 10;
var TEXT_POSITION_Y = 10;

var ERASING = false;
var INSERTING_TEXT = false;
var CURSOR_VISIBLE = false;
var CURSOR_REMOVED = false;


var current_state ='';



var imageList = [];
var imageData;
var App = {};

var RESET_SCREEN_EVENT = 'reset';

function compareImages(img1,img2){
  if (img1 != null && img2 != null) {
    if (img1.data.length != img2.data.length) {
      return false;
    }
    for (var i = 0; i < img1.data.length; ++i){
       if (img1.data[i] != img2.data[i]){
         return false;
       }
    }
    return true;
  }
  return false;
}

function saveImage(canvas, ctx) {
  imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
  imageList.push(imageData);
}

export default {
  data(){
    return {
      currentSession: SessionService.currentSession,
      showColors: false
    }
  },
  directives: {
    canvas(el){
      App.canvas = el;
      App.ctx = el.getContext('2d');
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      // this.emitChangeColor(LOCAL_LINE_COLOR);
      App.ctx.lineWidth = LINE_WIDTH;
      App.ctx.font = 'bold 64px Arial';
      saveImage(App.canvas, App.ctx);
    }
  },
  methods: {
    resizeCanvas(){
      var savedImage = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
      App.canvas.width = App.canvas.offsetWidth;
      App.canvas.height = App.canvas.offsetHeight;
      App.ctx.putImageData(savedImage, 0, 0);
    },

    // Socket emits
    emitDrawClick(){
      this.$socket.emit('drawClick', {
        sessionId: this.currentSession.sessionId,

      })
    },
    emitSaveImage(){
      this.$socket.emit('saveImage', {
        sessionId: this.currentSession.sessionId
      });
    },
    emitUndoClick(){
      this.$socket.emit('undoClick', {
        sessionId: this.currentSession.sessionId
      });
    },
    emitClearClick(){
      this.$socket.emit('clearClick', {
        sessionId: this.currentSession.sessionId
      });
    },
    emitChangeColor(color){
      this.$socket.emit('changeColor', {
        sessionId: this.currentSession.sessionId,
        color:color
      });
    },
    emitChangeWidth(width){
      this.$socket.emit('changeWidth', {
        sessionId: this.currentSession.sessionId,
        width
      });
    },
    emitDrawing() {
      this.$socket.emit('drawing', {
        sessionId: this.currentSession.sessionId
      });
    },
    emitEnd() {
      this.$socket.emit('end', {
        sessionId: this.currentSession.sessionId
      });
    },
    emitDragStart(data){
      this.$socket.emit('dragStart', {
        sessionId: this.currentSession.sessionId,
        x: data.x,
        y: data.y,
        color: data.color
      });
    },
    emitDragAction(data){
      this.$socket.emit('dragAction', {
        sessionId: this.currentSession.sessionId,
        x: data.x,
        y: data.y,
        color: data.color
      });
    },
    emitDragEnd(data){
      this.$socket.emit('dragEnd', {
        sessionId: this.currentSession.sessionId,
        x: data.x,
        y: data.y,
        color: data.color
      });
    },
    emitInsertText(data){
      this.$socket.emit('insertText', {
        sessionId: this.currentSession.sessionId,
        x: data.x,
        y: data.y,
        text: data.text
      });
    },
    emitResetScreen(data){
      this.$socket.emit('resetScreen', {
        sessionId: this.currentSession.sessionId
      });
    },

    // UI events


    hideBox: function() {
        this.$el.querySelector('#textInputBox').style.visibility='hidden';
        this.$el.querySelector('#textInputBox').value='';
        current_state = '';
    },
    changeColor: function(event){
      if (current_state===('DRAWING')) {
        LOCAL_LINE_COLOR = event.target.style.backgroundColor;
        App.ctx.strokeStyle = LOCAL_LINE_COLOR;
        this.emitChangeColor(LOCAL_LINE_COLOR);
        App.ctx.lineWidth = LINE_WIDTH;
        this.emitChangeWidth(LINE_WIDTH);
      } else if (current_state===('ERASING')) {
        App.ctx.strokeStyle = ERASING_LINE_COLOR;
        App.ctx.lineWidth = ERASING_LINE_WIDTH;
      }
    },
    clear: function() {
      App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
      imageList = [];
      saveImage(App.canvas, App.ctx);
      this.emitClearClick();;
    },
    drawStart: function(event) {

      if (!SERVER_DRAWING) {
          this.emitDrawing();
          if (!CURSOR_VISIBLE && current_state===('INSERTING_TEXT')) {
          TEXT_POSITION_X = event.layerX -10;
          TEXT_POSITION_Y = event.layerY +34;
          CURSOR_VISIBLE = true;
          saveImage(App.canvas, App.ctx);
          this.emitSaveImage();
          if (imageList.length>0) {
            imageData = imageList[imageList.length-1];
            App.ctx.putImageData(imageData, 0, 0);

          } else {
            imageData = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
          }

          imageList.push(imageData);
          App.ctx.fillText('|', TEXT_POSITION_X, TEXT_POSITION_Y);
          this.emitInsertText({
            text: '|',
            x: TEXT_POSITION_X,
            y: TEXT_POSITION_Y
          });
          CURSOR_REMOVED = false;
        } else if (current_state===('DRAWING')|| current_state==='ERASING') {

          saveImage(App.canvas, App.ctx);
          this.emitSaveImage();
          App.canvas.isDrawing = true;

           var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
          var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

          var x = event.pageX;
          var y = event.pageY;


          this.fillCircle(App.canvas, App.ctx, 'dragstart', false, x, y, LOCAL_LINE_COLOR);
          this.emitDragStart({
            x:x,
            y:y,
            color:LOCAL_LINE_COLOR
          });
        }
      }

    },
    drawEnd: function(event) {
      if (!SERVER_DRAWING){

          App.canvas.isDrawing = false;

          var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
          var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

           var x = event.pageX ;
          var y = event.pageY ;

        this.fillCircle(App.canvas, App.ctx, 'dragend', false, x, y, LOCAL_LINE_COLOR);
        this.emitDragEnd({
          x:x,
          y:y,
          color: LOCAL_LINE_COLOR
        });
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
        this.emitEnd();
      }

    },
    draw: function(e) {
      if (!SERVER_DRAWING){
          if (current_state===('DRAWING') || current_state==='ERASING') {
            if (!App.canvas.isDrawing) {
               return;
            }

             var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
            var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

            var x = event.pageX;
            var y = event.pageY;

            this.fillCircle(App.canvas, App.ctx, 'drag', false, x, y, LOCAL_LINE_COLOR);
            this.emitDragAction({
              x:x,
              y:y,
              color: LOCAL_LINE_COLOR
            });

          }
      }

    },
    drawSetup: function() {
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      this.emitChangeColor(LOCAL_LINE_COLOR);
      App.ctx.lineWidth = LINE_WIDTH;
      this.emitChangeWidth(LINE_WIDTH);

      this.$el.querySelector('#textInputBox').value=''
      this.$el.querySelector('#textInputBox').style.visibility='hidden';
      App.canvas.style.cursor = PEN_ICON;

      if (current_state===('INSERTING_TEXT')) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }

      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }

      current_state= 'DRAWING';

    },

    keydown: function(e) {
      if (this.$el.querySelector('#textInputBox').value==='' && e.keyCode!=8 && e.keyCode!=46) {
        if (imageList.length>0) {
          imageData = imageList.pop();
          App.ctx.putImageData(imageData, 0, 0);
        }
      }
    },

    text: function() {
      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }
      saveImage(App.canvas, App.ctx);
      this.emitSaveImage();

      current_state = 'INSERTING_TEXT';
      INSERTING_TEXT = true;
      CURSOR_VISIBLE = false;
      App.canvas.style.cursor = TEXT_ICON;
      this.$el.querySelector('#textInputBox').style.visibility='visible';
      this.$el.querySelector('#textInputBox').value='';

    },

    textBox: function() {

      if (CURSOR_VISIBLE) {
        handleUndoOperation();
        this.emitUndoClick();
        CURSOR_VISIBLE = false;
      }
      this.insertText(this.$el.querySelector('#whiteboardCanvas'), this.$el.querySelector('#textInputBox').value);
      this.emitInsertText({
        text: this.$el.querySelector('#textInputBox').value,
        x: TEXT_POSITION_X,
        y: TEXT_POSITION_Y
      });
    },

    undo: function() {
      var currentImage = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
      this.$el.querySelector('#textInputBox').value='';
      if (imageList.length>0) {
        imageData = imageList.pop();
        while (compareImages(currentImage, imageData)) {
          imageData = imageList.pop();
        }
        if (imageData!= null) {
          App.ctx.putImageData(imageData, 0, 0);
        }

        this.emitUndoClick();
      }
    },

    erase: function() {
      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }
      if (current_state===('INSERTING_TEXT')) {
        saveImage(App.canvas, App.ctx);
        this.emitSaveImage();
      }
      current_state = 'ERASING';
      App.ctx.strokeStyle = ERASING_LINE_COLOR;
      App.ctx.lineWidth = ERASING_LINE_WIDTH;
      App.canvas.style.cursor = ERASER_ICON;
      this.$el.querySelector('#textInputBox').value=''
      this.$el.querySelector('#textInputBox').style.visibility='hidden';
      this.emitChangeColor(ERASING_LINE_COLOR);
      this.emitChangeWidth(ERASING_LINE_WIDTH);
    },

    // Canvas manipulations
    fillCircle(canvas, context, type, server, x, y, fillColor) {
      var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
      var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

      var rect = App.canvas.getBoundingClientRect();
      if (server) {
        App.ctx.strokeStyle = SERVER_LINE_COLOR;
        App.ctx.lineWidth = SERVER_LINE_WIDTH;
      } else if (current_state==='ERASING') {
        App.ctx.strokeStyle = ERASING_LINE_COLOR;
        App.ctx.lineWidth = ERASING_LINE_WIDTH;
      }
      if (current_state===('DRAWING') || current_state===('ERASING') || server) {
        if (type === 'dragstart') {
          if (imageList.length>0) {
              imageData = imageList[imageList.length-1];
              context.putImageData(imageData, 0, 0);
          }
          context.beginPath();
          context.moveTo(x-scrollLeft-rect.left, y-scrollTop-rect.top+5);
        } else if (type === 'drag') {
          context.lineTo(x-scrollLeft-rect.left, y-scrollTop-rect.top+5);
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

      if (imageList.length>0) {

          imageData = imageList.pop();
          App.ctx.putImageData(imageData, 0, 0);
          imageList.push(imageData);

      }
      App.ctx.fillText(input, TEXT_POSITION_X, TEXT_POSITION_Y);
    },
    openColors() {
      this.showColors = !this.showColors;
    }
  },
  sockets: {
    dstart (data){
      this.fillCircle(App.canvas, App.ctx, 'dragstart', true,  data.x, data.y, data.color);
    },
    drag (data){
      this.fillCircle(App.canvas, App.ctx, 'drag', true, data.x, data.y, data.color);
    },
    dend (data){
      this.fillCircle(App.canvas, App.ctx, 'dragend', true,  data.x, data.y, data.color);
    },
    draw() {
      console.log('SERVER DRAWING');
      SERVER_DRAWING = true;
    },
    end() {
      console.log('SERVER DONE DRAWING');
      SERVER_DRAWING = false;
    },
    save (){
      var imageData = App.ctx.getImageData(0,0,App.canvas.width, App.canvas.height);
        imageList.push(imageData);
    },
    undo (){
      var currentImage = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
      if (imageList.length>0) {
        imageData = imageList.pop();
        while (compareImages(currentImage, imageData)) {
          imageData = imageList.pop();
        }
        if (imageData!= null) {
          App.ctx.putImageData(imageData, 0, 0);
        }

      }
    },
    clear (){
      App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
      imageList = [];
      saveImage(App.canvas, App.ctx);
    },
    color (newColor){
      SERVER_LINE_COLOR = newColor;
    },
    width (newWidth){
      SERVER_LINE_WIDTH = newWidth;
    },
    text (data){
      App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);

      if (imageList.length>0) {
        imageData = imageList.pop();
        App.ctx.putImageData(imageData, 0, 0);
        imageList.push(imageData);
      }
      App.ctx.fillText(data.text, data.x, data.y);
    }

  },
  mounted(){
    this.resizeCanvas();
    this.drawSetup();
    window.addEventListener('resize', this.resizeCanvas);
  }
}

</script>

<style scoped>

.whiteboard {
  height: 100%;
  display: flex;
  flex-direction: column;
}

canvas {
  width: 100%;
  height: 100%;
  background: #fff;
  display: block;
  cursor: not-allowed;
  flex: 1;
}

.whiteboardTools {
  height: 100px;
  padding: 10px 30px;
}

.whiteboardTools .toolset {
  display: flex;
}

.colorContainer {
  position: absolute;
  bottom: 125%;
  height: 100%;
  width: 100%;
  padding: 0px;
}

.whiteboardBtn {
  height:36px;
  width:36px;
  padding:20px;
  border:none;
  margin:2px;
  background-repeat: no-repeat;
  background-position: center;
  background-color: rgba(52,52,64,.6);
}

#eraseButton {
  background-image: url('../../assets/eraser_icon.png');
}

#drawButton {
  background-image: url('../../assets/pen_icon.png');
}

#undoButton {
  background-image: url('../../assets/undo.png');
}

#textButton {
  background-image: url('../../assets/Aa.png');
}

#clearButton {
  background-image: url('../../assets/new_page.png');
}

#openColorsButton {
}

</style>
