<template>
  <div class="chat">
    <div class="messages-container">
			<div class="messages">
				<template v-for="message in messages">
					<div class="message">
						<div class="avatar"></div>
						<div class="contents">
							<div class="time">
								{{message.time}}
							</div>
							{{message.contents}}
						</div>
					</div>
				</template>
			</div>
    </div>
    <textarea v-on:keyup.enter="sendMessage" v-model="newMessage" placeholder="Type here, press enter to send"></textarea>
  </div>
</template>

<script>

import $ from 'jquery'

import UserService from '../services/UserService'
import SessionService from '../services/SessionService'

var INITIALIZED = false;

var messages = [
	{name: 'Test', contents: 'This is a test message to style with', time: '5 minutes ago'},
	{name: 'Corey', contents: 'Ok let\'s test this out!', time: '6 minutes ago'},
	{name: 'Corey', contents: 'Ok let\'s test this out!', time: '6 minutes ago'},
	{name: 'Corey', contents: 'Ok let\'s test this out!', time: '6 minutes ago'},
	{name: 'Corey', contents: 'Ok let\'s test this out!', time: '6 minutes ago'},
	{name: 'Corey', contents: 'Ok let\'s test this out!', time: '6 minutes ago'},
	{name: 'Corey', contents: 'Ok let\'s test this out!', time: '6 minutes ago'},
	{name: 'Corey', contents: 'Ok let\'s test this out!', time: '6 minutes ago'}
];
var bottom = 0;

export default {
	data(){
		return {
      messages: messages,
			currentSession: SessionService.currentSession,
			newMessage: ''
		}
	},

  ready: function() {
      window.addEventListener('beforeunload', this.leaving);
  },

  methods: {

    leaving: function() {

    },

    sendMessage: function() {
      var message = this.newMessage;
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

      SessionService.socket.emit('message', {
				sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        message: message
      });

      this.newMessage = '';

      /*var msgBox = this.$el.querySelector('#messages');
      var msg = this.$el.querySelector('#messages').lastChild;
      messages.push({
              timeStamp: timeStamp + ' Me:',
              message: message
            });

      msgBox.scrollTop = msgBox.scrollHeight-msgBox.clientHeight;*/
      //console.log(msgBox.scrollHeight);
      //console.log(msgBox.scrollTop);
      //this.$el.querySelector('#messageList').lastChild.scrollIntoView(false)

    },

    handleMessageSendOperation(message) {
			console.log(message);
      this.messages.push(message);
    },

  },
  mounted() {
		let socket = SessionService.startChatSocket();

		socket.on('messageSend', receiveMessage);
  },

	updated(){
		var el = $('.messages');
		var scrollTop = el[0].scrollHeight - el[0].clientHeight;
		el.scrollTop(scrollTop)
	}
}


function receiveMessage(data) {
	console.log(data);
  messages.push({
		contents: data.contents,
		name: data.name,
		time: data.time
  });
}


</script>

<style scoped>
.chat {
	height: 100%;
	/*display: flex;
	flex-direction: column;
	justify-content: center;*/
}

.messages-container {
	height: 100%;
	padding-bottom: 100px;
	overflow: hidden;
}

.messages {
	height: 100%;
	overflow: scroll;
}

.message {
	position: relative;
	padding: 15px;
}

.avatar {
	position: absolute;
  width: 40px;
  height: 40px;
  background-image: url('../assets/defaultAvatar@2x.png');
  background-size: 40px 40px;
}

.time {
	font-size: 12px;
	font-weight: 200;
	color: #73737A;
}

.contents {
	padding-left: 50px;
	text-align: left;
}

textarea {
	width: 100%;
	height: 100px;
	border: none;
	position: absolute;
	left: 0;
	bottom: 0;
	border-top: 1px solid #979797;
	padding: 10px 12px;
}


</style>
