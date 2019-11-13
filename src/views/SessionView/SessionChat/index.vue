<template>
  <div class="chat">
    <vue-headful
      :title="
        typingIndicatorShown
          ? `${sessionPartner.firstname} is typing...`
          : 'UPchieve'
      "
    />

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
        <chat-bot v-if="!user.isVolunteer && isSessionWaitingForVolunteer" />

        <template v-for="(message, index) in messages">
          <div
            :key="`message-${index}`"
            :class="message.userId === user._id ? 'right' : 'left'"
            class="message"
          >
            <div class="avatar" :style="message.avatarStyle" />
            <div class="contents">
              <span>{{ message.contents }}</span>
            </div>
            <div class="time">
              {{ message.time }}
            </div>
          </div>
        </template>
      </div>
      <transition name="fade">
        <div class="typing-indicator" v-show="typingIndicatorShown">
          {{ this.sessionPartner.firstname }} is typing...
        </div>
      </transition>
    </div>

    <textarea
      class="message-textarea"
      @keydown.enter.prevent
      @keyup="handleMessage"
      v-model="newMessage"
      placeholder="Type a message..."
    />
  </div>
</template>

<script>
import { setTimeout, clearTimeout } from "timers";
import moment from "moment";
import _ from "lodash";
import { mapState, mapGetters } from "vuex";

import ChatBot from "./ChatBot";
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
  name: "session-chat",
  components: { ChatBot },
  data() {
    return {
      messages: [],
      currentSession: SessionService.currentSession,
      newMessage: "",
      chatWarningIsShown: false,
      typingTimeout: null,
      typingIndicatorShown: false
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      sessionPartner: "user/sessionPartner",
      isSessionWaitingForVolunteer: "user/isSessionWaitingForVolunteer"
    })
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
        user: this.user,
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
        sessionId: this.currentSession.sessionId
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
          userId: user._id,
          isVolunteer: user.isVolunteer,
          avatarStyle: {
            backgroundImage: `url(${picture})`
          },
          time: moment(message.createdAt).format("h:mm a")
        };
      });

      this.messages = messages;
    },
    "is-typing"() {
      this.typingIndicatorShown = true;
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
        userId: data.userId,
        isVolunteer: data.isVolunteer,
        avatarStyle: {
          backgroundImage: `url(${picture})`
        },
        time: moment(data.createdAt).format("h:mm a")
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
  background: #fff;
}

.message-box {
  height: 100%;
  padding-bottom: 60px;
  overflow: hidden;
  top: 0;
  position: relative;

  @include breakpoint-above("medium") {
    height: calc(100% - 60px);
    padding-bottom: 110px;
    top: 70px;
  }
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
  background: white;
  position: relative;
  height: 100%;
  overflow: auto;
  display: flex;
  padding-bottom: 45px;
  flex-direction: column;
}

.message {
  position: relative;
  padding: 24px;
  display: flex;
  justify-content: flex-start;
  // width: 100%;

  /* Safari needs this specified to lay out the message divs properly. */
  flex-shrink: 0;
}

span {
  font-size: 16px;
}

.avatar {
  width: 32px;
  height: 32px;
  background-size: cover;
  margin-top: 5px;
  border-radius: 16px;
  margin-right: 12px;
}

.name {
  font-weight: 600;
}

.time {
  font-size: 14px;
  font-weight: 500;
  color: #73737a;
  position: absolute;
  bottom: 0;
}

.contents {
  text-align: left;
  position: relative;
  padding: 10px 14px;
  overflow-wrap: break-word;
  font-size: 16px;
  background: #f1f3f6;
  border-radius: 20px;
  max-width: 80%;
}

.typing-indicator {
  position: absolute;
  bottom: 108px;
  left: 10px;
  padding: 0;
  font-size: 13px;
  font-weight: 300;
  transition: 0.15s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.message-textarea {
  width: 100%;
  height: 100px;
  border: none;
  position: absolute;
  left: 0;
  bottom: 0;
  border: none;
  border-top: 1px solid $c-border-grey;
  padding: 16px;
  resize: none;

  &:focus {
    outline: none;
  }
}

.left {
  float: left;

  .time {
    margin-left: 44px;
  }
}

.right {
  float: right;
  display: flex;
  flex-direction: row-reverse;

  .contents {
    background-color: $c-background-blue;

    span {
      color: $c-soft-black;
    }
  }

  .avatar {
    display: none;
  }
}

.message-content {
  width: 200px;
}

@include breakpoint-below("medium") {
  .message-textarea {
    width: calc(100% - 100px);
    height: 40px;
    border: none;
    position: absolute;
    left: 0;
    bottom: 0;
    border: 1px solid #d6e0ef;
    border-radius: 20px;
    margin: 10px 20px;
    padding: 10px 16px;
  }

  .typing-indicator {
    bottom: 58px;
    left: 35px;
  }
}
</style>
