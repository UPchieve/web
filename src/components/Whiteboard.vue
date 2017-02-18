<template>
	<div>
		<p>Room: <input v-model="room"> <button v-on:click="changeRoom">Change</button></p>
		<canvas id='whiteboard' v-on:mousedown="drawStart" v-on:mouseup="drawEnd" v-on:mousemove="draw"></canvas>
		<button id='clearButton' v-on:click="clear" ></button>
		<button id='drawButton' v-on:click="drawSetup"></button>
		<button id='undoButton' v-on:click="undo"></button>
		<button id='eraseButton' v-on:click="erase"></button>
		<button id='textButton' v-on:click="text"></button>
		<button id='blueButton' class='colorButton' v-on:click="color" style='padding:0px;margin:0px;width:28px;height:28px;background-color:blue;'></button>
		<button id='redButton' class='colorButton' v-on:click="color" style='padding:0px;margin:0px;width:28px;height:28px;background-color:red;'></button>
		<button id='greenButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:green;'></button>
		<button id='blackButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:black;'></button>
		<button id='orangeButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:orange;'></button>
		<button id='yellowButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:yellow;'></button>
		<button id='purpleButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:purple;'></button>
		<button id='brownButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:brown;'></button>
		<textarea id='textInputBox' v-on:input="textBox" v-on:keydown="keydown" rows='4' cols='50' style='visibility:hidden' placeholder='Type Here'></textarea>
	</div>
</template>

<script>

import AuthService from '../services/AuthService'

var SOCKET_ADDRESS = 'http://localhost:3001';

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
var LOCAL_LINE_COLOR = 'black';
var SERVER_LINE_COLOR = 'black';
var SERVER_LINE_WIDTH = 5;
var LINE_WIDTH = 5;
var LINE_CAP = 'round';

var ERASING = false;
var ERASING_LINE_COLOR = 'white';
var ERASING_LINE_WIDTH = 20;

var DRAWING = false;



var ERASER_ICON = 'url(\'/static/Eraser-icon.png\'), auto';
var PEN_ICON = 'url(\"/static/Pen-icon.png\"), auto';
var TEXT_ICON = 'text';



var TEXT_POSITION_X = 10;
var TEXT_POSITION_Y = 10;
var INSERTING_TEXT = false;
var CURSOR_VISIBLE = false;
var CURSOR_REMOVED = false;
var imageList = [];
var imageData;
var App = {};
var INITIALIZED = false;

App.socket = require('socket.io-client')(SOCKET_ADDRESS);
App.socket.on(DRAW_START_EVENT, handleDrawStartOperation);
App.socket.on(DRAW_ACTION_EVENT, handleDrawActionOperation);
App.socket.on(DRAW_END_EVENT, handleDrawEndOperation);
App.socket.on(SAVE_EVENT, handleSaveOperation);
App.socket.on(UNDO_EVENT, handleUndoOperation);
App.socket.on(CLEAR_EVENT, handleClearOperation);
App.socket.on(COLOR_CHANGE_EVENT, handleColorChangeOperation);
App.socket.on(WIDTH_CHANGE_EVENT, handleWidthChangeOperation);
App.socket.on(INSERT_TEXT_EVENT, handleInsertTextOperation);


export default {
	data(){
		return {
			room: 'test'
		}
	},
  methods: {
		changeRoom(){
			console.log('Room changed to', this.room)
			App.socket.emit('room', this.room);
		},

    color: function(event){

      if (DRAWING && !ERASING) {
        LOCAL_LINE_COLOR = event.target.style.backgroundColor;
        App.ctx.strokeStyle = LOCAL_LINE_COLOR;
        App.socket.emit('changeColor', LOCAL_LINE_COLOR);
        App.ctx.lineWidth = LINE_WIDTH;
        App.socket.emit('changeWidth', LINE_WIDTH);

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

      if (!CURSOR_VISIBLE && INSERTING_TEXT) {

        TEXT_POSITION_X = event.layerX -10;
        TEXT_POSITION_Y = event.layerY +34;
        CURSOR_VISIBLE = true;
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
      } else if (!INSERTING_TEXT) {

        DRAWING = true;
        App.canvas.isDrawing = true;
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
      var x = event.pageX;
      var y = event.pageY;
      fillCircle(App.canvas, App.ctx, 'dragend', false, x, y, LOCAL_LINE_COLOR);
      App.socket.emit('dragEnd', {
          x:x,
          y:y,
          color:LOCAL_LINE_COLOR
        });
    },

    draw: function(e) {

      if (DRAWING) {
        if (!App.canvas.isDrawing) {
           return;
        }
        var x = e.pageX;
        var y = e.pageY;
        fillCircle(App.canvas, App.ctx, 'drag', false, x, y, LOCAL_LINE_COLOR);
        App.socket.emit('dragAction', {
          x:x,
          y:y,
          color:LOCAL_LINE_COLOR
        });

      }
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


    drawSetup: function() {
      //App.socket.emit('drawClick');
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      App.socket.emit('changeColor', LOCAL_LINE_COLOR);
      App.ctx.lineWidth = LINE_WIDTH;
      App.socket.emit('changeWidth', LINE_WIDTH);

      this.$el.querySelector('#textInputBox').value=''
      this.$el.querySelector('#textInputBox').style.visibility='hidden';
      App.canvas.style.cursor = PEN_ICON;
      if (INSERTING_TEXT) {
        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
      }

      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
      }

      DRAWING = true;
      ERASING = false;
      INSERTING_TEXT = false;

    },

    erase: function() {
      if (imageList.length === 0) {
        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
      }
      if (INSERTING_TEXT) {
        saveImage(App.canvas, App.ctx);
        App.socket.emit('saveImage');
      }
      ERASING = true;
      INSERTING_TEXT = false;
      App.ctx.strokeStyle = ERASING_LINE_COLOR;
      App.ctx.lineWidth = ERASING_LINE_WIDTH;
      App.canvas.style.cursor = ERASER_ICON;
      this.$el.querySelector('#textInputBox').value=''
      this.$el.querySelector('#textInputBox').style.visibility='hidden';
      App.socket.emit('changeColor', ERASING_LINE_COLOR);
      App.socket.emit('changeWidth', ERASING_LINE_WIDTH);

    }

  },
  mounted() {
			var initRoom = this.room;

			App.socket.on('connect', function(){
				console.log(initRoom);
				App.socket.emit('room', initRoom);
			});


      App.canvas = this.$el.querySelector('#whiteboard');
      App.ctx = App.canvas.getContext('2d');
      App.canvas.width=800;
      App.canvas.height=400;
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      App.socket.emit('changeColor', LOCAL_LINE_COLOR);
      App.ctx.lineWidth = LINE_WIDTH;
      App.ctx.font = 'bold 16px Arial';
      saveImage(App.canvas, App.ctx);

  }
}


function fillCircle(canvas, context, type, server, x, y, fillColor) {
  var rect = App.canvas.getBoundingClientRect();
  if (server) {
    App.ctx.strokeStyle = SERVER_LINE_COLOR;
    App.ctx.lineWidth = SERVER_LINE_WIDTH;
  }
  if (DRAWING || ERASING || server) {
    if (type === 'dragstart') {
      if (imageList.length>0) {
          imageData = imageList[imageList.length-1];
          context.putImageData(imageData, 0, 0);
      }
      context.beginPath();
      context.moveTo(x-rect.left, y-rect.top+40);
    } else if (type === 'drag') {
      context.lineTo(x-rect.left, y-rect.top+40);
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
    if (imageData!=null) {
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
  width:800px;
  height:400px;
	margin: 20px auto;
	border: 5px solid #E8E8E8;
	display: block;
 	cursor: not-allowed;
}

#eraseButton {
	height:28px;
	width:28px;
	background-image: url('../assets/Eraser-icon-24.png');
	padding:0px;
	margin:0px;
}

#drawButton {
	height:28px;
	width:28px;
	background-image: url('../assets/Pen-icon-24.png');
	padding:0px;
	margin:0px;
}

#undoButton {
	height:28px;
	width:28px;
	background-image: url('../assets/Arrows-Undo-icon.png');
	padding:0px;
	margin:0px;
}

#textButton {
	height:28px;
	width:28px;
	background-image: url('../assets/Text-Effect-icon.png');
	padding:0px;
	margin:0px;
}

#clearButton {
	height:28px;
	width:28px;
	background-image: url('../assets/Paper-icon.png');
	padding:0px;
	margin:0px;
}

</style>
