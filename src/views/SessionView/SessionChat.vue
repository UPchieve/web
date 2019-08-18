<template>
  <div class="chat">
    <vue-headful
      :title="typingIndicatorShown ? `${otherUser} is typing...` : 'UPchieve'"
    />
    <div class="header">Chat</div>

    <div class="message-box">
      <transition name="chat-warning--slide">
        <div class="chat-warning" v-show="chatWarningIsShown">
          Messages cannot contain personal information or profanity
          <span class="chat-warning__close" @click="hideModerationWarning"
            >×</span
          >
        </div>
      </transition>

      <div class="messages">
        <template v-for="(message, index) in messages">
          <div
            :key="`message-${index}`"
            :class="message.email === user.email ? 'right' : 'left'"
            class="message"
          >
            <div class="avatar" :style="message.avatarStyle" />
            <div class="contents">
              <div class="name">
                {{ message.name }}
              </div>
              <span>{{ message.contents }}</span>
              <div class="time">
                {{ message.time }}
              </div>
            </div>
          </div>
        </template>
      </div>
      <transition name="fade">
        <div class="typing-indicator" v-show="typingIndicatorShown">
          {{ this.otherUser }} is typing...
        </div>
      </transition>
    </div>

    <textarea
      @keydown.enter.prevent
      @keyup="handleMessage"
      v-model="newMessage"
      placeholder="Type here..."
    />
  </div>
</template>

<script>
import { setTimeout, clearTimeout } from "timers";
import moment from "moment";
import _ from "lodash";

import UserService from "@/services/UserService";
import SessionService from "@/services/SessionService";
import ModerationService from "@/services/ModerationService";
import StudentAvatarUrl from "@/assets/defaultavatar3.png";
import VolunteerAvatarUrl from "@/assets/defaultavatar4.png";

/**
 * @todo {1} Use more descriptive names that comply with the coding standards.
 *           Keep in mind that it also requires a small backend update in
 *           router/sockets.js
 */
export default {
  data() {
    return {
      user: UserService.getUser(),
      otherUser: null,
      messages: [],
      currentSession: SessionService.currentSession,
      newMessage: "",
      chatWarningIsShown: false,
      typingTimeout: null,
      typingIndicatorShown: false
    };
  },

  methods: {
    showModerationWarning() {
      this.chatWarningIsShown = true;
    },
    hideModerationWarning() {
      this.chatWarningIsShown = false;
    },
    showNewMessage(message) {
      this.$socket.emit("message", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser(),
        message
      });
    },
    clearMessageInput() {
      this.newMessage = "";
    },
    notTyping() {
      // Tell the server that the user is no longer typing
      this.$socket.emit("notTyping", {
        sessionId: this.currentSession.sessionId
      });
    },
    handleMessage(event) {
      // If key pressed is Enter, send the message
      if (event.key == "Enter") {
        const message = this.newMessage.trim();
        this.clearMessageInput();

        // Early exit if message is blank
        if (_.isEmpty(message)) return;

        // Reset the chat warning
        this.hideModerationWarning();

        // Check for personal info/profanity in message
        ModerationService.checkIfMessageIsClean(this, message).then(isClean => {
          if (isClean) {
            this.showNewMessage(message);
          } else {
            this.showModerationWarning();
          }
        });

        // Disregard typing handler for enter
        this.notTyping();
        return;

        // Disregard typing handler for backspace
      } else if (event.key == "Backspace") return;

      // Typing handler for when non-Enter/Backspace keys are pressed
      this.$socket.emit("typing", {
        sessionId: this.currentSession.sessionId,
        user: UserService.getUser()
      });

      /** Every time a key is pressed, set an inactive timer
          If another key is pressed within 2 seconds, reset timer**/
      clearTimeout(this.typingTimeout);
      this.typingTimeout = setTimeout(() => {
        this.notTyping();
      }, 2000);
    }
  },

  sockets: {
    "session-change"(data) {
      // {1}
      SessionService.currentSession.sessionId = data._id;
      SessionService.currentSession.data = data;

      // re-render the session's persisted whiteboard canvas
      const img = new Image();
      img.src = data.whiteboardUrl;
      img.onload = () => window.App.ctx.drawImage(img, 0, 0);

      // index session's participants by user id
      const studentId = (data.student || {})._id;
      const volunteerId = (data.volunteer || {})._id;

      const participants = {};
      participants[studentId] = data.student;
      participants[volunteerId] = data.volunteer;

      // re-load the session's persisted messages
      const messages = data.messages.map(message => {
        let { picture } = message;
        const user = participants[message.user] || {};

        if (!picture || picture === "") {
          picture = user.isVolunteer ? VolunteerAvatarUrl : StudentAvatarUrl;
        }

        return {
          contents: message.contents,
          name: user.firstname,
          email: user.email,
          isVolunteer: user.isVolunteer,
          avatarStyle: {
            backgroundImage: `url(${picture})`
          },
          time: moment(message.time).format("h:mm a")
        };
      });

      this.messages = messages;
    },
    "is-typing"(data) {
      this.typingIndicatorShown = true;
      this.otherUser = data;
    },
    "not-typing"() {
      this.typingIndicatorShown = false;
    },
    messageSend(data) {
      // {1}
      let { picture } = data;
      if (!picture || picture === "") {
        if (data.isVolunteer === true) {
          picture = VolunteerAvatarUrl;
        } else {
          picture = StudentAvatarUrl;
        }
      }
      this.messages.push({
        contents: data.contents,
        name: data.name,
        email: data.email,
        isVolunteer: data.isVolunteer,
        avatarStyle: {
          backgroundImage: `url(${picture})`
        },
        time: moment(data.time).format("h:mm a")
      });
    }
  },

  updated() {
    let msgBox = document.querySelector(".messages");
    msgBox.scrollTop = msgBox.scrollHeight;
  }
};
</script>

<style lang="scss" scoped>
.chat {
  height: 100%;
  position: relative;
}

.header {
  height: 40px;
  background-color: #1855d1;
  color: #fff;
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
  background: $c-shadow-warn;
  color: #fff;
  font-weight: normal;
  min-height: 40px;
  position: absolute;
  left: 0;
  top: 0;
  padding: 12px 52px 12px 12px;
  transition: all 0.15s ease-in;
  z-index: 1;
}
.chat-warning__close {
  font-size: 3.5rem;
  width: 40px;
  padding: 10px;
  margin-right: 5px;
  cursor: pointer;
  display: block;
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
}
.chat-warning--slide-enter,
.chat-warning--slide-leave-to {
  top: -64px;
}

.messages {
  position: relative;
  height: 100%;
  overflow: auto;
  display: flex;
  padding-bottom: 25px;
  flex-direction: column;
}

.message {
  position: relative;
  padding: 10px;
  display: flex;
  justify-content: flex-start;
  background: #fff;
  width: 100%;

  /* Safari needs this specified to lay out the message divs properly. */
  flex-shrink: 0;
}

.avatar {
  width: 30px;
  height: 30px;
  background-size: cover;
  margin-top: 5px;
}

.name {
  font-weight: 600;
}

.time {
  font-size: 12px;
  font-weight: 300;
  color: #73737a;
}

.contents {
  text-align: left;
  position: relative;
  width: 200px;
  overflow-wrap: break-word;
  font-size: 16px;
}

.typing-indicator {
  position: absolute;
  bottom: 0;
  font-size: 13px;
  margin-bottom: 100px;
  padding: 8px;
  font-weight: 300;
  transition: 0.15s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
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
