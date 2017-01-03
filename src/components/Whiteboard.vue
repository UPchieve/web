<template>

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



</template>

<script>
export default {
}
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
 	cursor:url("Pen-icon.png"), auto;
}

#eraseButton {
	height:28px;
	width:28px;
	background-image: url("Eraser-icon-24.png");
	padding:0px;
	margin:0px;
}

#drawButton {
	height:28px;
	width:28px;
	background-image: url("Pen-icon-24.png");
	padding:0px;
	margin:0px;
}

#undoButton {
	height:28px;
	width:28px;
	background-image: url("Arrows-Undo-icon.png");
	padding:0px;
	margin:0px;
}

#textButton {
	height:28px;
	width:28px;
	background-image: url("Text-Effect-icon.png");
	padding:0px;
	margin:0px;
}

#clearButton {
	height:28px;
	width:28px;
	background-image: url("Paper-icon.png");
	padding:0px;
	margin:0px;
}

</style>