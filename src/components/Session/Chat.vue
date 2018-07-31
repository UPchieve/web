<template>
<div class="chat">
  
  <div class="header">Chat</div>

  <div class="message-box">

    <div class="chat-warning">
      Messages cannot contain personal information
      <span class="chat-warning__close" @click="hideModerationWarning">×</span>
    </div>

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
import moment from 'moment';

import UserService from 'src/services/UserService';
import SessionService from 'src/services/SessionService';
import ModerationService from 'src/services/ModerationService';

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
    showModerationWarning() {
      document.querySelector('.chat-warning').style.top = 0;
    },
    hideModerationWarning() {
      document.querySelector('.chat-warning').style.top = '';
    },

    showNewMessage(message) {
      this.$socket.emit('message', {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        message: message
      });
      this.newMessage = '';
    },

    sendMessage() {
      let message = this.newMessage.slice(0,-1);

      if (message != '') {

        ModerationService.checkIfMessageIsClean(this, message).then((isClean) => {

          if (isClean != null) {

            if (isClean) {
              this.showNewMessage(message);
            } 
            else {
              this.showModerationWarning();
            }
          }          
          else {
            this.showNewMessage(message);
          }
        });  
      }
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
    	if (!picture || picture === '') {
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
  position: relative;
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

.message-box {
	height: calc(100% - 40px);
	padding-bottom: 100px;
	overflow: hidden;
  top: 40px;
  position: relative;
}

.chat-warning {
  width: 100%;
  background: #ff0000;
  color: #fff;
  font-weight: bold;
  min-height: 40px;
  position: absolute;
  left: 0;
  top: -64px;
  padding: 12px 52px 12px 12px;
  transition: all .15s ease-in;
}
.chat-warning__close {
  font-size: 2rem;
  width: 40px;
  padding: 12px;
  cursor: pointer;
  display: block;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}

.messages {
	height: 100%;
	overflow: auto;
  display: flex;
  flex-direction: column;
}

.message {
	position: relative;
	padding: 10px;
  display: flex;
  min-height: 61px;
  margin-bottom: 12px;
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
