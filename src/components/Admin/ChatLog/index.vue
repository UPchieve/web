<template>
  <div class="chat-log">
    <div class="chat-log__header">
      <div v-if="student"><student-icon class="chat-log__icon"/> {{ student.firstname }}</div>
      <div v-if="volunteer"><volunteer-icon class="chat-log__icon"/> {{ volunteer.firstname }}</div>
    </div>
    <div class="chat-log__messages-container">
      <!-- TODO: use session chat component when it is created -->
      <chat-message
        v-for="message in messages"
        :message="message"
        :key="`message-${message.user}-${message.createdAt}`"
        class="chat-log__message"
        :class="{
          'chat-log__message--right':
            volunteer && message.user === volunteer._id
        }"
        :studentId="student._id"
        :volunteerId="volunteer && volunteer._id"
      />
    </div>
  </div>
</template>

<script>
import ChatMessage from './ChatMessage'
import StudentIcon from '@/assets/student-icon.svg'
import VolunteerIcon from '@/assets/volunteer-icon.svg'

export default {
  name: 'ChatLog',

  components: { ChatMessage, StudentIcon, VolunteerIcon },

  props: {
    messages: Array[Object],
    student: Object,
    volunteer: Object
  }
}
</script>

<style lang="scss" scoped>
.chat-log {
  min-width: 300px;
  width: 100%;
  max-width: 400px;
  font-size: 14px;

  &__header {
    display: flex;
    justify-content: space-between;
    margin: 10px 0;
  }

  &__messages-container {
    display: flex;
    flex-direction: column;
    max-height: 350px;
    overflow-y: scroll;
  }

  &__message {
    align-self: flex-start;
    margin: 1em 0;

    &--right {
      align-self: flex-end;
      text-align: right;
    }
  }

  &__icon {
    width: 30px;
    height: 30px;
  }
}
</style>
