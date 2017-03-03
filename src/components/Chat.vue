<template>
  <div class="chat">
    <div class="messages-container">
			<div class="messages">
				<template v-for="message in messages">
					<div class="message">
						<div class="avatar" v-bind:style="message.avatarStyle"></div>
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
import moment from 'moment'

import UserService from '../services/UserService'
import SessionService from '../services/SessionService'

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
  mounted() {
		this.$socket.emit('join', {
			sessionId: SessionService.currentSession.sessionId,
			user: UserService.getUser()
		});
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
  /*background-image: url('../assets/defaultAvatar@2x.png');*/
  background-size: cover;
}

.time {
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
