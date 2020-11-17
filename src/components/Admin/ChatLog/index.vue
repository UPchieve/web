<template>
  <div class="chat-log">
    <div class="chat-log__header">
      <div v-if="student">🎓 {{ student.firstname }}</div>
      <div v-if="volunteer">🍎 {{ volunteer.firstname }}</div>
    </div>
    <div class="chat-log__messages-container">
      <chat-message
        v-for="message in messages"
        :message="message"
        :key="`message-${message.user}-${message.createdAt}`"
        class="chat-log__message"
        :class="{
          'chat-log__message--right':
            volunteer && message.user === volunteer._id
        }"
      />
    </div>
  </div>
</template>

<script>
import ChatMessage from "./ChatMessage";

export default {
  name: "ChatLog",

  components: { ChatMessage },

  props: {
    messages: Array[Object],
    student: Object,
    volunteer: Object
  }
};
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
    margin: 5px 0;

    &--right {
      align-self: flex-end;
      text-align: right;
    }
  }
}
</style>
