<template>
	<body>
		<article><!-- our canvas will be inserted here--></article>
		<button id="clearButton"></button>
		<button id="drawButton"></button>
		<button id="undoButton"></button>
		<button id="eraseButton"></button>
		<button id="textButton"></button>
		<button id="blueButton" class="colorButton" style="padding:0px;margin:0px;width:28px;height:28px;background-color:blue;"></button>
		<button id="redButton" class="colorButton" style="padding:0px;margin:0px;width:28px;height:28px;background-color:red;"></button>
		<button id="greenButton" class="colorButton" style="padding:0px;margin:0px;width:28px;height:28px;background-color:green;"></button>
		<button id="blackButton" class="colorButton" style="padding:0px;margin:0px;width:28px;height:28px;background-color:black;"></button>
		<button id="orangeButton" class="colorButton" style="padding:0px;margin:0px;width:28px;height:28px;background-color:orange;"></button>
		<button id="yellowButton" class="colorButton" style="padding:0px;margin:0px;width:28px;height:28px;background-color:yellow;"></button>
		<button id="purpleButton" class="colorButton" style="padding:0px;margin:0px;width:28px;height:28px;background-color:purple;"></button>
		<button id="brownButton" class="colorButton" style="padding:0px;margin:0px;width:28px;height:28px;background-color:brown;"></button>
		<textarea id="textInputBox" rows="4" cols="50" style="visibility:hidden" placeholder="Type Here"></textarea>
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



(function() {
  var App;
  var imageData;
  var imageList = [];
  App = {};
  App.init = function() {
    // Create the canvas, which will end up being our whiteboard.
    drawInitialCanvas()

    // Handle click events for our clear and undo buttons.
    document.getElementById(CLEAR_BUTTON_ID).onclick = handleClearClick;
    document.getElementById(UNDO_BUTTON_ID).onclick = handleUndoClick;
    document.getElementById(ERASE_BUTTON_ID).onclick = handleEraseClick;
    document.getElementById(DRAW_BUTTON_ID).onclick = handleDrawClick;
    document.getElementById(TEXT_BUTTON_ID).onclick = handleTextClick;

    setColorButtonListeners();

    // Connect socket and register listeners for server events.
    App.socket = io.connect(SOCKET_ADDRESS);
    App.socket.on(DRAW_EVENT, handleDrawOperation);
    App.socket.on(SAVE_EVENT, handleSaveOperation);
    App.socket.on(UNDO_EVENT, handleUndoOperation);
    App.socket.on(CLEAR_EVENT, handleClearOperation);
    App.socket.on(COLOR_CHANGE_EVENT, handleColorChangeOperation);
    App.socket.on(WIDTH_CHANGE_EVENT, handleWidthChangeOperation);
    App.socket.on(INSERT_TEXT_EVENT, handleInsertTextOperation);
    App.socket.on(RESET_SCREEN_EVENT, handleResetScreenOperation);
    
    // Setup draw function for our canvas.
    App.draw = handleCanvasDraw;
  };

  function handleCanvasDraw(x, y, type, local) {

    if (local==='local') {
      if (ERASING) {
        App.ctx.strokeStyle = ERASING_LINE_COLOR;
        App.ctx.lineWidth = ERASING_LINE_WIDTH;
      } else {
        App.ctx.lineWidth = LINE_WIDTH;
        App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      }
      
    } else {
      if (local==='server') {
        App.ctx.strokeStyle = SERVER_LINE_COLOR;
        App.ctx.lineWidth = SERVER_LINE_WIDTH;
      }
 
    }
    if (type === 'dragstart') {
      App.ctx.beginPath();
      return App.ctx.moveTo(x, y);
    } else if (type === 'drag') {
      App.ctx.lineTo(x, y);
      return App.ctx.stroke();
    } else {
      return App.ctx.closePath();
    }
  }



  function drawInitialCanvas() {
    App.canvas = document.createElement('canvas');
    App.canvas.height = CANVAS_HEIGHT;
    App.canvas.width = CANVAS_WIDTH;
    document.getElementsByTagName('article')[0].appendChild(App.canvas);
    App.ctx = App.canvas.getContext('2d');
    App.ctx.fillStyle = LINE_FILL_STYLE;
    App.ctx.font = 'bold 16px Arial';
    
    App.ctx.strokeStyle = LOCAL_LINE_COLOR;
    App.ctx.lineWidth = LINE_WIDTH;
    App.ctx.lineCap = LINE_CAP;
  
  }

  function setColorButtonListeners() {
    var classname = document.getElementsByClassName('colorButton');

    for (var i = 0; i < classname.length; i++) {
      classname[i].addEventListener('click', setLineColor, false);
    }
  }

  function setLineColor() {
    LOCAL_LINE_COLOR = this.style.backgroundColor;
    if (!ERASING) {
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      App.socket.emit('changeColor', LOCAL_LINE_COLOR);
    } else {
      handleDrawClick();
    }
    
  }


  function handleClearClick() {
    $('#textInputBox').val('');
    handleClearOperation();
    App.socket.emit('clearClick');
  }

  function handleUndoClick() {
    $('#textInputBox').val('');
    handleUndoOperation();
    App.socket.emit('undoClick');
  }

  function handleEraseClick() {
    INSERTING_TEXT = false;
    CURSOR_VISIBLE = false;
    document.getElementById(TEXT_AREA_ID).style.visibility ='hidden';
    $('#textInputBox').val('');
    handleEraseOperation();
  }

  function handleDrawClick() {
    ERASING = false;
    INSERTING_TEXT = false;
    CURSOR_VISIBLE = false;
    document.getElementById(TEXT_AREA_ID).style.visibility ='hidden';
    $('#textInputBox').val('');
    if (!ERASING) {
      App.ctx.strokeStyle = LOCAL_LINE_COLOR;
      App.ctx.lineWidth = LINE_WIDTH;
      App.canvas.style.cursor=PEN_ICON;
      App.socket.emit('changeColor', LOCAL_LINE_COLOR);
      App.socket.emit('changeWidth', LINE_WIDTH);
    }
    
  }

  function handleTextClick() {
    INSERTING_TEXT = true;
    CURSOR_VISIBLE = false;
    $('#textInputBox').val('');
    document.getElementById(TEXT_AREA_ID).style.visibility ='visible';
    App.canvas.style.cursor = TEXT_ICON;
  }

  function handleColorChangeOperation(color) {
    SERVER_LINE_COLOR = color;
  }

  function handleWidthChangeOperation(width) {
    SERVER_LINE_WIDTH = width;
  }


  function handleDrawOperation(data) {
    return App.draw(data.x, data.y, data.type, 'server');
  }

  function handleSaveOperation() {
    imageData = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
    imageList.push(imageData);
  }

  function handleClearOperation() {
    App.ctx.clearRect(0, 0, App.canvas.width, App.canvas.height); 
  }

  function handleUndoOperation() {
    if (imageList.length>0) {
        imageData = imageList.pop();
        App.ctx.putImageData(imageData, 0, 0);
    } 
  }

  function handleEraseOperation() {
    ERASING = true;
    if (ERASING) {
      App.ctx.strokeStyle = ERASING_LINE_COLOR;
      App.ctx.lineWidth = ERASING_LINE_WIDTH;
      App.canvas.style.cursor=ERASER_ICON;
      App.socket.emit('changeColor', ERASING_LINE_COLOR);
      App.socket.emit('changeWidth', ERASING_LINE_WIDTH);
    } 
  }

  function handleInsertTextOperation(data) {
    App.ctx.fillText(data.text, data.x, data.y);
  }

  function handleResetScreenOperation() {
    imageData = imageList.pop();
    App.ctx.putImageData(imageData, 0, 0);
    imageList.push(imageData);
  }
  
  /*
  	Draw Events
  */

  $('#textInputBox').live('keydown', function(e) {
    if ($('#textInputBox').val()==='') {
      imageData = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
      imageList.push(imageData);
      App.socket.emit('saveImage');
    }
    
  });


 $('#textInputBox').live('input', function(e) { 
    if (CURSOR_VISIBLE && !CURSOR_REMOVED) {
      if (imageList.length>0) {
        imageData = imageList.pop();
        App.ctx.putImageData(imageData, 0, 0);
        CURSOR_REMOVED = true;
        App.socket.emit('undoClick');
      }
    }   
    handleClearOperation();
    App.socket.emit('clearClick');
    if (imageList.length>0) {
        handleResetScreenOperation();
        App.socket.emit('resetScreen');
    } 
    App.ctx.fillText($('#textInputBox').val(), TEXT_POSITION_X, TEXT_POSITION_Y);
    App.socket.emit('insertText', {
        text: $('#textInputBox').val(),
        x: TEXT_POSITION_X,
        y: TEXT_POSITION_Y
      });
  });

  $('canvas').live('click', function(e) {
    if (!CURSOR_VISIBLE && INSERTING_TEXT) {
      TEXT_POSITION_X = e.layerX-10;
      TEXT_POSITION_Y = e.layerY+34;
      CURSOR_VISIBLE = true;
      App.socket.emit('saveImage');
      imageData = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
      imageList.push(imageData);
      App.ctx.fillText('|', TEXT_POSITION_X, TEXT_POSITION_Y);
      App.socket.emit('insertText', {
        text: '|',
        x: TEXT_POSITION_X,
        y: TEXT_POSITION_Y
      });
      CURSOR_REMOVED = false;
    }
  });

  $('canvas').live('drag dragstart dragend', function(e) {
    if (!INSERTING_TEXT) {
      var type, x, y;
      type = e.handleObj.type;
      if (type=='dragstart') {
        App.socket.emit('saveImage');
        imageData = App.ctx.getImageData(0,0,App.canvas.width,App.canvas.height);
        imageList.push(imageData);
      }
      x = e.layerX-10;
      y = e.layerY+34;
      App.draw(x, y, type, 'local');
      App.socket.emit('drawClick', {
        x: x,
        y: y,
        type: type
      });
    }
    
  });
  $(function() {
    return App.init();
  });
}).call(this);

</script>

<style scoped>
	html,body,div,span,applet,object,iframe,h1,h2,h3,h4,h5,h6,p,blockquote,pre,a,abbr,acronym,address,big,cite,code,del,dfn,em,img,ins,kbd,q,s,samp,small,strike,strong,sub,sup,tt,var,b,u,i,center,dl,dt,dd,ol,ul,li,fieldset,form,label,legend,table,caption,tbody,tfoot,thead,tr,th,td,article,aside,canvas,details,embed,figure,figcaption,footer,header,hgroup,menu,nav,output,ruby,section,summary,time,mark,audio,video{border:0;font-size:100%;font:inherit;vertical-align:baseline;margin:0;padding:0;}article,aside,details,figcaption,figure,footer,header,hgroup,menu,nav,section{display:block;}body{line-height:1;}ol,ul{list-style:none;}blockquote,q{quotes:none;}blockquote:before,blockquote:after,q:before,q:after{content:none;}table{border-collapse:collapse;border-spacing:0;}.clearfix:after{content:".";display:block;clear:both;visibility:hidden;line-height:0;height:0;}.clearfix{display:inline-block;}html[xmlns] .clearfix{display:block;}* html .clearfix{height:1%;}



body {
	background: #392C44;
}
	
	
canvas {
	background: #fff;
	margin: 20px auto;
	border: 5px solid #E8E8E8;
	display: block;
 	cursor:url("../assets/Pen-icon.png"), auto;
}

#eraseButton {
	height:28px;
	width:28px;
	background-image: url("../assets/Eraser-icon-24.png");
	padding:0px;
	margin:0px;
}

#drawButton {
	height:28px;
	width:28px;
	background-image: url("../assets/Pen-icon-24.png");
	padding:0px;
	margin:0px;
}

#undoButton {
	height:28px;
	width:28px;
	background-image: url("../assets/Arrows-Undo-icon.png");
	padding:0px;
	margin:0px;
}

#textButton {
	height:28px;
	width:28px;
	background-image: url("../assets/Text-Effect-icon.png");
	padding:0px;
	margin:0px;
}

#clearButton {
	height:28px;
	width:28px;
	background-image: url("../assets/Paper-icon.png");
	padding:0px;
	margin:0px;
}

</style>