<template>
  <div class="chat">
    <div class="header">Chat</div>
    <div class="messages-container">
			<div class="messages">
				<template v-for="message in messages">
					<div class="message">
						<div class="avatar" v-bind:style="message.avatarStyle"></div>
						<div class="contents">
              <div class="name">
								{{message.name}}
							</div>
							{{message.contents}}
              <div class="time">
								{{message.time}}
							</div>
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
import moment from 'moment'

import UserService from 'src/services/UserService'
import SessionService from 'src/services/SessionService'

const DEFAULT_AVATAR_URL = 'static/defaultAvatar@2x.png';

export default {
	data(){
		return {
      messages: [],
			currentSession: SessionService.currentSession,
			newMessage: ''
		}
	},
  methods: {
    sendMessage: function() {
      var message = this.newMessage;

      this.$socket.emit('message', {
				sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        message: message
      });

      this.newMessage = '';
    },
  },
  sockets: {
    'session-change'(data){
      console.log('session-change', data);
      SessionService.currentSession.sessionId = data._id;
      SessionService.currentSession.data = data;
    },
    messageSend(data){
    	console.log(data);
    	var picture = data.picture;
    	if (!picture || picture === ''){
    		picture = DEFAULT_AVATAR_URL
    	}
      this.messages.push({
    		contents: data.contents,
    		name: data.name,
    		avatarStyle: {
    			backgroundImage: `url(${picture})`
    		},
    		time: moment(data.time).format('h:mm:ss a')
      });
    }
  },

	updated(){
		var el = $('.messages');
		var scrollTop = el[0].scrollHeight - el[0].clientHeight;
		el.scrollTop(scrollTop)
	}
}


</script>

<style scoped>
.chat {
	height: 100%;
}

.header {
  height: 40px;
  background-color: #1855D1;
  color: #FFF;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  padding: 13px;
  position: absolute;
  width: 100%;
}

.messages-container {
	height: calc(100% - 40px);
	padding-bottom: 100px;
	overflow: hidden;
  top: 40px;
  position: relative;
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
  /*background-image: url('../assets/defaultAvatar@2x.png');*/
  background-size: cover;
}

.name, .time {
	font-size: 12px;
	font-weight: 300;
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
