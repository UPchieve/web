<template>
  <div class="chat-message">
    <div :class="message.user === volunteerId && 'chat-message--volunteer'">
      <component class="chat-message__avatar" :is="avatar"/>
      <div class="chat-message__content">{{ message.contents }}</div>
    </div>
    <div class="chat-message__timestamp">{{ timestamp }}</div>
  </div>
</template>

<script>
import moment from 'moment'
import getChatAvatar from '@/utils/get-chat-avatar'

export default {
  name: 'ChatMessage',

  props: {
    message: Object,
    studentId: String,
    volunteerId: {
      type: String,
      default: ''
    }
  },

  computed: {
    timestamp() {
      return moment(this.message.createdAt).format('h:mm a')
    },
    avatar(){
      return getChatAvatar(this.message.user, this.studentId, this.volunteerId)
    }
  }
}
</script>

<style lang="scss" scoped>
.chat-message {
  text-align: left;

  &__avatar {
    width: 32px;
    height: 32px;
    margin: 0 0.4em;
  }

  &__content {
    max-width: 250px;
    background: #eaffff;
    display: inline-flex;
    border-radius: 20px;
    padding: 5px 15px;
  }

  &__timestamp {
    font-size: 12px;
    color: #a9a9bb;
    padding: 0 10px;
  }

  &--volunteer {
    display: flex;
    flex-direction: row-reverse;
  }
}
</style>
