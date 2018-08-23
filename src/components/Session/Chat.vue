<template>
  <div class="chat">
    <div class="header">Chat</div>
    <div class="messages-container">
			<div class="messages">
				<template v-for="message in messages">
					<div class="message" v-bind:class="leftRightMessage(message)">
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
    <textarea v-on:keyup.enter="sendMessage" v-model="newMessage" placeholder="Type here."></textarea>
  </div>
</template>

<script>

import $ from 'jquery'
import moment from 'moment'

import UserService from 'src/services/UserService'
import SessionService from 'src/services/SessionService'

const DEFAULT_AVATAR_URL = 'static/defaultAvatar@2x.png';
//student
//http://localhost:8080/static/defaultavatar3.png
const STUDENT_AVATAR_URL = 'static/defaultavatar3.png';
//volunteer
const VOLUNTEER_AVATAR_URL = 'static/defaultavatar4.png';


export default {
	data(){
    var user = UserService.getUser();
		return {
      user: user,
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
    leftRightMessage: function(message) {
      if (message.name == this.user.firstname) {
        return 'left';
      } else {
        return 'right';
      }
    }
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
        if(data.isVolunteer === true){

            picture = VOLUNTEER_AVATAR_URL;
      
        }else{

            picture = STUDENT_AVATAR_URL;

        }
        //picture = DEFAULT_AVATAR_URL
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
