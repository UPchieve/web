<template>
  <div class="whiteboard">
      <canvas id='whiteboard' v-on:mousedown="drawStart" v-on:mouseup="drawEnd" v-on:mousemove="draw"></canvas>
      <div class="row" style="background-color:rgba(238,238,238,1)">
        <div class="col-sm-6 col-centered" style="margin-top:20px">

          <button id='drawButton' v-on:click="drawSetup"></button>
          <button id='eraseButton' v-on:click="erase"></button>
          <button id='undoButton' v-on:click="undo"></button>
          <button id='textButton' v-on:click="text"></button>
          <button id='clearButton' v-on:click="clear" ></button>

        </div>
      <div class="col-sm-6 col-centered" style="margin-top:20px">
            <button class='colorButton' v-on:click="color" style='padding:0px;margin:0px;border:none;width:36px;height:36px;background-color:rgba(244,71,71,1);'></button>
            <button class='colorButton' v-on:click="color" style='padding:0px;margin:0px;border:none;width:36px;height:36px;background-color:rgba(255,208,115,.6);'></button>
            <button class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;border:none;width:36px;height:36px;background-color:rgba(22,210,170,.6);'></button>
            <button class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;border:none;width:36px;height:36px;background-color:rgba(24,85,209,.6);'></button>
            <button class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;border:none;width:36px;height:36px;background-color:rgba(52,52,64,.6);'></button>
            <button class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;border:none;width:36px;height:36px;background-color:rgba(38,51,104,1);'></button>


            <textarea id='textInputBox' v-on:input="textBox" v-on:keydown="keydown" v-on:keyup.enter="hideBox" rows='4' cols='50' style='visibility:hidden' placeholder='Type Here'></textarea>

      </div>
    </div>
  </div>
</template>

<script>

import AuthService from '../services/AuthService'
import SessionService from '../services/SessionService'

var CLEAR_BUTTON_ID = 'clearButton';
var UNDO_BUTTON_ID = 'undoButton';
var ERASE_BUTTON_ID = 'eraseButton';
var DRAW_BUTTON_ID = 'drawButton';
var TEXT_BUTTON_ID = 'textButton';
var TEXT_AREA_ID = 'textInputBox'

var DRAW_EVENT = 'draw';
var DRAW_START_EVENT = 'dstart';
var DRAW_END_EVENT = 'dend';
var DRAW_ACTION_EVENT = 'drag';
var SAVE_EVENT = 'save';
var UNDO_EVENT = 'undo';
var CLEAR_EVENT = 'clear';
var COLOR_CHANGE_EVENT = 'color';
var WIDTH_CHANGE_EVENT = 'width';
var INSERT_TEXT_EVENT = 'text';
var RESET_SCREEN_EVENT = 'reset';


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



var ERASER_ICON = 'url(\'/static/Eraser-icon.png\'), auto';
var PEN_ICON = 'url(\"/static/Pen-icon.png\"), auto';
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
var INITIALIZED = false;

var messages = [];
var bottom = 0;

export default {
  data(){
    return {
      room: 'test'
    }
  },
  methods: {

    hideBox: function() {
        this.$el.querySelector('#textInputBox').style.visibility='hidden';
        this.$el.querySelector('#textInputBox').value='';
        current_state = '';
    },

    color: function(event){

      if (current_state===('DRAWING')) {
        LOCAL_LINE_COLOR = event.target.style.backgroundColor;
        App.ctx.strokeStyle = LOCAL_LINE_COLOR;
        App.socket.emit('changeColor', LOCAL_LINE_COLOR);
        App.ctx.lineWidth = LINE_WIDTH;
        App.socket.emit('changeWidth', LINE_WIDTH);

      } else if (current_state===('ERASING')) {
        App.ctx.strokeStyle = ERASING_LINE_COLOR;
        App.ctx.lineWidth = ERASING_LINE_WIDTH;
      }

    },

    clear: function() {
      App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
      imageList = [];
      saveImage(App.canvas, App.ctx);
      App.socket.emit('clearClick');
      console.log(this.room);
    },

    drawStart: function(event) {

      if (!CURSOR_VISIBLE && current_state===('INSERTING_TEXT')) {
        TEXT_POSITION_X = event.layerX -10;
        TEXT_POSITION_Y = event.layerY +34;
        CURSOR_VISIBLE = true;
        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
        if (imageList.length>0) {
          imageData = imageList[imageList.length-1];
          App.ctx.putImageData(imageData, 0, 0);

        } else {
          imageData = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
        }

        imageList.push(imageData);
        App.ctx.fillText('|', TEXT_POSITION_X, TEXT_POSITION_Y);
        App.socket.emit('insertText', {
          text: '|',
          x: TEXT_POSITION_X,
          y: TEXT_POSITION_Y
        });
        CURSOR_REMOVED = false;
      } else if (current_state===('DRAWING')|| current_state==='ERASING') {

        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
        App.canvas.isDrawing = true;

         var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
        var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

         var x = event.pageX;
        var y = event.pageY;

        fillCircle(App.canvas, App.ctx, 'dragstart', false, x, y, LOCAL_LINE_COLOR);
        App.socket.emit('dragStart', {
          x:x,
          y:y,
          color:LOCAL_LINE_COLOR
        });
      }

    },

    drawEnd: function(event) {
      App.canvas.isDrawing = false;

        var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
        var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

         var x = event.pageX ;
        var y = event.pageY ;

      fillCircle(App.canvas, App.ctx, 'dragend', false, x, y, LOCAL_LINE_COLOR);
      App.socket.emit('dragEnd', {
          x:x,
          y:y,
          color:LOCAL_LINE_COLOR
      });
      saveImage(App.canvas, App.ctx);
      App.socket.emit('saveImage');
    },

    draw: function(e) {
      if (current_state===('DRAWING') || current_state==='ERASING') {
        if (!App.canvas.isDrawing) {
           return;
        }

         var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
        var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;

        var x = event.pageX;
        var y = event.pageY;

        fillCircle(App.canvas, App.ctx, 'drag', false, x, y, LOCAL_LINE_COLOR);
        App.socket.emit('dragAction', {
          x:x,
          y:y,
          color:LOCAL_LINE_COLOR
        });

      }
    },

    drawSetup: function() {
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      App.socket.emit('changeColor', LOCAL_LINE_COLOR);
      App.ctx.lineWidth = LINE_WIDTH;
      App.socket.emit('changeWidth', LINE_WIDTH);

      this.$el.querySelector('#textInputBox').value=''
      this.$el.querySelector('#textInputBox').style.visibility='hidden';
      App.canvas.style.cursor = PEN_ICON;

      if (current_state===('INSERTING_TEXT')) {
        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
      }

      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
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
        App.socket.emit('saveImage');
      }
      saveImage(App.canvas, App.ctx);
      App.socket.emit('saveImage');

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
        App.socket.emit('undoClick');
        CURSOR_VISIBLE = false;
      }
      insertText(this.$el.querySelector('#whiteboard'), this.$el.querySelector('#textInputBox').value);
      App.socket.emit('insertText', {
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

        App.socket.emit('undoClick');
      }
    },

    erase: function() {
      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
      }
      if (current_state===('INSERTING_TEXT')) {
        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
      }
      current_state = 'ERASING';
      App.ctx.strokeStyle = ERASING_LINE_COLOR;
      App.ctx.lineWidth = ERASING_LINE_WIDTH;
      App.canvas.style.cursor = ERASER_ICON;
      this.$el.querySelector('#textInputBox').value=''
      this.$el.querySelector('#textInputBox').style.visibility='hidden';
      App.socket.emit('changeColor', ERASING_LINE_COLOR);
      App.socket.emit('changeWidth', ERASING_LINE_WIDTH);

    },

    handleMessageSendOperation(message) {
      this.messages.push(message);
    },

  },
  mounted() {
      var initRoom = this.room;

      App.socket.on(DRAW_START_EVENT, handleDrawStartOperation);
      App.socket.on(DRAW_ACTION_EVENT, handleDrawActionOperation);
      App.socket.on(DRAW_END_EVENT, handleDrawEndOperation);
      App.socket.on(SAVE_EVENT, handleSaveOperation);
      App.socket.on(UNDO_EVENT, handleUndoOperation);
      App.socket.on(CLEAR_EVENT, handleClearOperation);
      App.socket.on(COLOR_CHANGE_EVENT, handleColorChangeOperation);
      App.socket.on(WIDTH_CHANGE_EVENT, handleWidthChangeOperation);
      App.socket.on(INSERT_TEXT_EVENT, handleInsertTextOperation);

      App.socket.on('connect', function(){
        App.socket.emit('join', initRoom);
      });


      App.canvas = this.$el.querySelector('#whiteboard');
      App.ctx = App.canvas.getContext('2d');
      App.canvas.width=800;
      App.canvas.height=400;
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      App.socket.emit('changeColor', LOCAL_LINE_COLOR);
      App.ctx.lineWidth = LINE_WIDTH;
      App.ctx.font = 'bold 64px Arial';
      saveImage(App.canvas, App.ctx);

      var canvas = this.$el.querySelector('#whiteboard');
      fitToContainer(canvas);

      function fitToContainer(canvas){
        canvas.style.width ='100%';
        canvas.style.height='100%';
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }
  }
}

function fillCircle(canvas, context, type, server, x, y, fillColor) {
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
      context.moveTo(x-scrollLeft-rect.left, y-scrollTop-rect.top+40);
    } else if (type === 'drag') {
      context.lineTo(x-scrollLeft-rect.left, y-scrollTop-rect.top+40);
      context.stroke();
    } else {
      context.closePath();
      saveImage(canvas, context);
      App.socket.emit('saveImage');

    }
    if (server) {
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      App.ctx.lineWidth = LINE_WIDTH;
    }
  }
}

function handleDrawStartOperation(data) {
  fillCircle(App.canvas, App.ctx, 'dragstart', true,  data.x, data.y, data.color);
}

function handleDrawActionOperation(data) {
  fillCircle(App.canvas, App.ctx, 'drag', true, data.x, data.y, data.color);
}

function handleDrawEndOperation(data) {
  fillCircle(App.canvas, App.ctx, 'dragend', true,  data.x, data.y, data.color);
}

function insertText(canvas, input) {
  App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);

  if (imageList.length>0) {

      imageData = imageList.pop();
      App.ctx.putImageData(imageData, 0, 0);
      imageList.push(imageData);

  }
  App.ctx.fillText(input, TEXT_POSITION_X, TEXT_POSITION_Y);
}

function saveImage(canvas, ctx) {
  imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
  imageList.push(imageData);
}

function handleSaveOperation() {
  var imageData = App.ctx.getImageData(0,0,App.canvas.width, App.canvas.height);
  imageList.push(imageData);
}

function handleUndoOperation() {
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
}

function compareImages(img1,img2){
  if (img1!=null && img2!=null) {
    if(img1.data.length != img2.data.length)
       return false;
     for(var i = 0; i < img1.data.length; ++i){
         if(img1.data[i] != img2.data[i])
             return false;
     }
     return true;
  }
  return false;

}

function handleInsertTextOperation(data) {

    App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);

    if (imageList.length>0) {
        imageData = imageList.pop();
        App.ctx.putImageData(imageData, 0, 0);
        imageList.push(imageData);
    }
    App.ctx.fillText(data.text, data.x, data.y);

}

function handleClearOperation() {
    App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height);
    imageList = [];
    saveImage(App.canvas, App.ctx);
}

function handleColorChangeOperation(color) {
    SERVER_LINE_COLOR = color;
}

function handleWidthChangeOperation(width) {
    SERVER_LINE_WIDTH = width;
  }


</script>

<style scoped>
  html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{border:0;font-size:100%;font:inherit;vertical-align:baseline;margin:0;padding:0;}article,aside,details,figcaption,figure,footer,header,hgroup,menu,nav,section{display:block;}body{line-height:1;}ol,ul{list-style:none;}blockquote,q{quotes:none;}blockquote:before,blockquote:after,q:before,q:after{content:none;}table{border-collapse:collapse;border-spacing:0;}.clearfix:after{content:'.';display:block;clear:both;visibility:hidden;line-height:0;height:0;}.clearfix{display:inline-block;}html[xmlns] .clearfix{display:block;}* html .clearfix{height:1%;}



body {
  padding:50px;
  background: #f2f2f2;
}


canvas {
  background: #fff;
  border: 5px solid #E8E8E8;
  display: block;
  cursor: not-allowed;
}

#eraseButton {
  height:36px;
  width:36px;
  background-color: rgba(52,52,64,.6);
  background-image: url('../assets/eraser_icon.png');
  padding:0px;
  border:none;
  margin:0px;
  background-repeat: no-repeat;
  background-position: center;
}

#drawButton {
  height:36px;
  width:36px;
  background-color: rgba(52,52,64,.6);
  background-image: url('../assets/pen_icon.png');
  padding:0px;
  margin:0px;
  border:none;
  background-repeat: no-repeat;
  background-position: center;
}

#undoButton {
  height:36px;
  width:36px;
  border:none;
  background-color: rgba(52,52,64,.6);
  background-image: url('../assets/undo.png');
  padding:0px;
  margin:0px;
  background-repeat: no-repeat;
  background-position: center;
}

#textButton {
  height:36px;
  width:36px;
  border:none;
  background-color: rgba(52,52,64,.6);
  background-image: url('../assets/Aa.png');
  padding:0px;
  margin:0px;
  background-repeat: no-repeat;
  background-position: center;
}

#clearButton {
  height:36px;
  width:36px;
  border:none;
  background-color: rgba(52,52,64,.6);
  background-image: url('../assets/new_page.png');
  padding:0px;
  margin:0px;
  background-position: center;
  background-repeat: no-repeat;
}

</style>
