<template>
	<div class="container">
		<p>Room: <input v-model="room"> <button v-on:click="changeRoom">Change</button></p>

    <div class="row">
      <div class = "col-sm-12">
            <div id='messages' style="height:500px; width:200px;border:1px solid #ccc;font:16px/26px Georgia, Garamond, Serif;overflow:scroll;">
                <ul style="list-style:none" id='messageList'>
                  <template v-for="message in messages">
                    <li>
                        <div class = "row">
                            <div class="col-sm-2" style="background: #f2f2f2;">
                                {{message.timeStamp}}
                            </div>
                            <div class="col-sm-5 text-left" style="overflow-wrap:break-word">
                                {{message.message}}
                            </div>
                        </div>

                    </li>
                  </template>
                </ul>
            </div>
              <textarea id='messageSendBox' v-on:keyup.enter="sendMessage"></textarea>
      </div>
  </div>
</div>    
</template>

<script>

import AuthService from '../services/AuthService'

var SOCKET_ADDRESS = 'http://localhost:3001';

var SEND_MESSAGE_EVENT = 'messageSend';


var App = {};
var INITIALIZED = false;

App.socket = require('socket.io-client')(SOCKET_ADDRESS);
App.socket.on(SEND_MESSAGE_EVENT, receiveMessage);

var messages = [];
var bottom = 0;

export default {
	data(){
		return {
      messages: messages,
			room: 'test'
		}
	},
  methods: {
		changeRoom(){
			console.log('Room changed to', this.room)
			App.socket.emit('room', this.room);
		},

    sendMessage: function() {
      var message = this.$el.querySelector('#messageSendBox').value;
      var timeStamp;

      var dt = new Date();
      var hours = dt.getHours();
      var minutes = dt.getMinutes();

      if (hours>12) {
         if (dt.getMinutes()<10) {
            timeStamp = (hours-12)+':0'+dt.getMinutes()+' PM';
         } else {
            timeStamp = (hours-12)+':'+dt.getMinutes()+' PM';
         }
         
      } else if (hours==12){
        if (dt.getMinutes()<10) {
            timeStamp = (hours)+':0'+dt.getMinutes()+' PM';
         } else {
            timeStamp = (hours)+':'+dt.getMinutes()+' PM';
         }
      } else
      { 
         if (dt.getMinutes()<10) {
            timeStamp = (hours)+':0'+dt.getMinutes()+' AM';
         } else {
            timeStamp = (hours)+':'+dt.getMinutes()+' AM';
         }
      }
       
      App.socket.emit('message', {
        timeStamp: timeStamp,
        message: message
      });

      this.$el.querySelector('#messageSendBox').value='';
      
      var msgBox = this.$el.querySelector('#messages');
      var msg = this.$el.querySelector('#messages').lastChild;
      messages.push({
              timeStamp: timeStamp + ' Me:',
              message: message
            });

      msgBox.scrollTop = msgBox.scrollHeight-msgBox.clientHeight;
      //console.log(msgBox.scrollHeight);
      //console.log(msgBox.scrollTop);
      //this.$el.querySelector('#messageList').lastChild.scrollIntoView(false)
      
    },

    handleMessageSendOperation(message) {
      this.messages.push(message);
    },

  },
  mounted() {
			var initRoom = this.room;

			App.socket.on('connect', function(){
				console.log(initRoom);
				App.socket.emit('room', initRoom);
			});

      var messages = this.$el.querySelector('#messages');
      var messagebox = this.$el.querySelector('#messageSendBox');
      fitMessages(messagebox);

      messages.style.width = this.$el.querySelector('#messageSendBox').offsetWidth+'px';
      //messages.style.height =this.$el.querySelector('#whiteboard').offsetHeight+'px';
      

      function fitToContainer(canvas){
        canvas.style.width ='100%';   
        canvas.style.height='100%';
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
      }

      function fitMessages(messagebox){
        messagebox.style.width ='100%';   
        messagebox.style.height='100%';
      }
  }
}


function receiveMessage(message) {      

      messages.push({
              timeStamp: message.timeStamp+' Them:',
              message: message.message
            });

 
}


</script>

<style scoped>
</style>
