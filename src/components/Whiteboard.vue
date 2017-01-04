<template>
	<body>
		<canvas id='whiteboard' v-on:click="cursor"></canvas>
		<button id='clearButton' v-on:click="clear" ></button>
		<button id='drawButton'></button>
		<button id='undoButton'></button>
		<button id='eraseButton'></button>
		<button id='textButton' v-on:click="text"></button>
		<button id='blueButton' class='colorButton' v-on:click="color" style='padding:0px;margin:0px;width:28px;height:28px;background-color:blue;'></button>
		<button id='redButton' class='colorButton' v-on:click="color" style='padding:0px;margin:0px;width:28px;height:28px;background-color:red;'></button>
		<button id='greenButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:green;'></button>
		<button id='blackButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:black;'></button>
		<button id='orangeButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:orange;'></button>
		<button id='yellowButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:yellow;'></button>
		<button id='purpleButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:purple;'></button>
		<button id='brownButton' class='colorButton' v-on:click="color"  style='padding:0px;margin:0px;width:28px;height:28px;background-color:brown;'></button>
		<textarea id='textInputBox' v-on:input="textBox" rows='4' cols='50' style='visibility:hidden' placeholder='Type Here'></textarea>
	</body>

</template>

<script>



var SOCKET_ADDRESS = 'http://localhost:4000';

var CLEAR_BUTTON_ID = 'clearButton';
var UNDO_BUTTON_ID = 'undoButton';
var ERASE_BUTTON_ID = 'eraseButton';
var DRAW_BUTTON_ID = 'drawButton';
var TEXT_BUTTON_ID = 'textButton';
var TEXT_AREA_ID = 'textInputBox'

var DRAW_EVENT = 'draw';
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

var ERASER_ICON = 'url(\'Eraser-icon.png\'), auto';
var PEN_ICON = 'url(\'Pen-icon.png\'), auto';
var TEXT_ICON = 'text';

var TEXT_POSITION_X = 10;
var TEXT_POSITION_Y = 10;
var INSERTING_TEXT = false;
var CURSOR_VISIBLE = false;
var CURSOR_REMOVED = false;
var imageList = [];
var imageData;


//alert($('#canvas').css('background-color'));


export default {
  
  methods: {
    color: function(event){
      var App = {};
      App.canvas = this.$el.querySelector('#whiteboard');
      App.canvas.width=800;
      App.canvas.height=400;
      App.ctx = App.canvas.getContext('2d');
      App.ctx.strokeStyle = event.target.style.backgroundColor;
    },

    clear: function() {
      var App = {};
      App.canvas = this.$el.querySelector('#whiteboard');
      App.ctx = App.canvas.getContext('2d');
      App.ctx.font = 'bold 16px Arial';
      App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height); 
    },

    cursor: function(event) {
      var App = {};
      App.canvas = this.$el.querySelector('#whiteboard');
      App.canvas.width=800;
      App.canvas.height=400;
      App.ctx = App.canvas.getContext('2d');
      App.ctx.font = 'bold 16px Arial';

      /*if (imageList.length>0) {
        imageData = imageList.pop();
        App.ctx.putImageData(imageData, 0, 0);
      }
      
      TEXT_POSITION_X = event.layerX-10;
      TEXT_POSITION_Y = event.layerY+34;
      App.ctx.fillText('|', TEXT_POSITION_X, TEXT_POSITION_Y);
      this.$el.querySelector('#textInputBox').value=''; */


      if (!CURSOR_VISIBLE && INSERTING_TEXT) {
        TEXT_POSITION_X = event.layerX-10;
        TEXT_POSITION_Y = event.layerY+34;
        CURSOR_VISIBLE = true;
        //App.socket.emit('saveImage');
        if (imageList.length>0) {
          console.log('PUTTING NEW IMAGE ON SCREEN');
          imageData = imageList[imageList.length-1];
          App.ctx.putImageData(imageData, 0, 0);
        } else {
          imageData = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
        }
        
        imageList.push(imageData);
        App.ctx.fillText('|', TEXT_POSITION_X, TEXT_POSITION_Y);
        /*App.socket.emit('insertText', {
          text: '|',
          x: TEXT_POSITION_X,
          y: TEXT_POSITION_Y
        });*/
        CURSOR_REMOVED = false;
      }

    }, 

    text: function() {
      var App = {};
      App.canvas = this.$el.querySelector('#whiteboard');
      App.ctx = App.canvas.getContext('2d');
      saveImage(App.canvas, App.ctx);
      INSERTING_TEXT = true;
      CURSOR_VISIBLE = false;
      App.canvas.style.cursor = TEXT_ICON;
      this.$el.querySelector('#textInputBox').style.visibility='visible';
      this.$el.querySelector('#textInputBox').value='';

    },

    textBox: function() {
      insertText(this.$el.querySelector('#whiteboard'), this.$el.querySelector('#textInputBox').value);
    }


  }
}

function insertText(canvas, input) {
  var App = {};
  App.canvas = canvas;
  App.ctx = App.canvas.getContext('2d');
  App.ctx.font = 'bold 16px Arial';
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







</script>

<style scoped>
	html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{border:0;font-size:100%;font:inherit;vertical-align:baseline;margin:0;padding:0;}article,aside,details,figcaption,figure,footer,header,hgroup,menu,nav,section{display:block;}body{line-height:1;}ol,ul{list-style:none;}blockquote,q{quotes:none;}blockquote:before,blockquote:after,q:before,q:after{content:none;}table{border-collapse:collapse;border-spacing:0;}.clearfix:after{content:'.';display:block;clear:both;visibility:hidden;line-height:0;height:0;}.clearfix{display:inline-block;}html[xmlns] .clearfix{display:block;}* html .clearfix{height:1%;}



body {
	background: #392C44;
}
	
	
canvas {
	background: #fff;
  width:800px;
  height:400px;
	margin: 20px auto;
	border: 5px solid #E8E8E8;
	display: block;
 	cursor:url('../assets/Pen-icon.png'), auto;
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