<template>
  <div class="chat">
    
    <div class="header">Chat</div>

    <div class="messages-container">
			<div class="messages">
				<template v-for="message in messages">

					<div class="message" :class="message.name === user.firstname ? 'left' : 'right'">
						<div class="avatar" :style="message.avatarStyle"></div>
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

    <textarea @keyup.enter="sendMessage" v-model="newMessage" placeholder="Type here..."></textarea>

  </div>
</template>


<script>
import moment from 'moment'

import UserService from 'src/services/UserService'
import SessionService from 'src/services/SessionService'

const DEFAULT_AVATAR_URL = 'static/defaultAvatar@2x.png';

export default {
	data() {
		return {
      user: UserService.getUser(),
      messages: [],
			currentSession: SessionService.currentSession,
			newMessage: ''
		}
	},

  methods: {
    sendMessage() {
      let message = this.newMessage;

      this.$socket.emit('message', {
				sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        message: message
      });

      this.newMessage = '';
    }
  },

  sockets: {
    'session-change'(data) {
      console.log('session-change', data);
      SessionService.currentSession.sessionId = data._id;
      SessionService.currentSession.data = data;
    },
    messageSend(data) {
    	console.log(data);
    	let picture = data.picture;
    	if (!picture || picture === ''){
    		picture = DEFAULT_AVATAR_URL;
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

	updated() {
		let msgBox = document.querySelector('.messages');
		msgBox.scrollTop = msgBox.scrollHeight;
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
  display: flex;
  flex-direction: column;
}

.message {
	position: relative;
	padding: 10px;
  display: flex;
  justify-content: flex-start;
}

.avatar {
  width: 30px;
  height: 30px;
  /*background-image: url('../assets/defaultAvatar@2x.png');*/
  background-size: cover;
  align-self: center;
}

.name {
  font-weight: 600;
}

.time {
	font-size: 12px;
	font-weight: 300;
	color: #73737A;
}

.contents {
	text-align: left;
  width: 200px;
  overflow-wrap: break-word;
  font-size: 16px;
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

.left {
  float: left;
}

.right {
  float: right;
  display: flex;
  flex-direction: row-reverse;
}

.right .contents {
  text-align: right;
  padding-right: 10px;
}

.left .contents {
  text-align: left;
  padding-left: 10px;
}

.message-content {
  width: 200px;
}


</style>
