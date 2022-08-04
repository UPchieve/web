<template>
  <div class="chat">
    <div class="chat-header">
      <component class="chat-header__avatar" :is="studentAvatar" />
      <div class="chat-header__title">Session Chat</div>
    </div>
    <div class="chat-contents">
      <template v-for="(message, index) in messages">
        <div
          :key="`message-${index}`"
          :class="messageAlignment(message)"
          class="message"
        >
          <component
            class="avatar"
            :is="avatar(message)"
            v-if="message.user !== user._id"
          />
          <div class="contents" :class="messageStyling(message)">
            <span>{{ message.contents }}</span>
          </div>
          <div class="time">
            {{ message.createdAt | formatTime }}
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import getChatAvatar from '@/utils/get-chat-avatar'
import StudentIcon from '@/assets/student-icon.svg'
import VolunteerIcon from '@/assets/volunteer-icon.svg'
import { mapState } from 'vuex'

const MESSAGE_ALIGNMENT = {
  LEFT: 'left',
  RIGHT: 'right',
}

export default {
  name: 'chat-log',
  components: { StudentIcon, VolunteerIcon },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
  },
  data() {
    return {
      studentAvatar: StudentIcon,
      volunteerAvatar: VolunteerIcon,
    }
  },
  props: {
    messages: Array[String],
    studentId: String,
    volunteerId: String,
  },
  methods: {
    messageAlignment(message) {
      return message.user === this.user._id
        ? MESSAGE_ALIGNMENT.RIGHT
        : MESSAGE_ALIGNMENT.LEFT
    },
    avatar(message) {
      return getChatAvatar(message.user, this.studentId, this.volunteerId)
    },
    messageStyling(message) {
      const isStudentMessage = message.user === this.studentId
      const isVolunteerMessage = message.user === this.volunteerId
      if (!isStudentMessage && !isVolunteerMessage) return 'contents--chat-bot'
      return ''
    },
  },
}
</script>

<style lang="scss" scoped>
.chat-contents {
  position: relative;
  background-color: $upchieve-white;
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;
  height: 700px;
  border-radius: 0px 0px 8px 8px;
}

.chat {
  max-width: 500px;

  @include breakpoint-below('large') {
    max-width: unset;
  }
}

.chat-header {
  background-color: $c-information-blue;
  padding: 21px;
  text-align: left;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  border-radius: 8px 8px 0px 0px;

  &__avatar {
    width: 40px;
    height: 40px;
  }

  &__title {
    font-weight: 600;
    font-size: 18px;
    color: #fff;
    margin-left: 1em;
  }
}

.message {
  position: relative;
  padding: 1.5em;
  display: flex;
  justify-content: flex-start;

  /* Safari needs this specified to lay out the message divs properly. */
  flex-shrink: 0;
}

.left {
  .time {
    margin-left: 44px;
  }
}

.right {
  flex-direction: row-reverse;

  .contents {
    background-color: $c-background-blue;
  }
}

.avatar {
  width: 32px;
  height: 32px;
  margin-top: 0.3125em;
  border-radius: 16px;
  margin-right: 0.75em;
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
  padding: 0.625em 0.875em;
  overflow-wrap: break-word;
  background-color: $c-background-grey;
  border-radius: 20px;
  max-width: 80%;
  white-space: pre-line;

  &--chat-bot {
    background-color: $upchieve-chat-bot-green;
  }
}
</style>
