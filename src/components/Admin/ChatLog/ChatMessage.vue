<template>
  <div class="chat-message">
    <div class="chat-message__content">{{ message.contents }}</div>
    <div class="chat-message__timestamp">{{ timestamp }}</div>
  </div>
</template>

<script>
import moment from "moment";

export default {
  name: "ChatMessage",

  props: {
    message: Object
  },

  computed: {
    timestamp() {
      return moment(this.message.createdAt).format("h:mm a");
    }
  }
};
</script>

<style lang="scss" scoped>
.chat-message {
  text-align: left;

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
}
</style>
