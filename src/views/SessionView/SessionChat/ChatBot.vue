<template>
  <div class="chat-bot">
    <div class="waiting-cards">
      <div
        class="waiting-cards__card"
        v-for="(botMsg, index) in sentBotMessages"
        :key="index"
      >
        <p>
          {{ botMsg.msg }}
        </p>
      </div>
    </div>
    <div class="typing-indicator" v-if="isStillMessaging">
      <span></span>
      <span></span>
      <span></span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "chat-bot",

  data() {
    return {
      unsentBotMessages: [],
      sentBotMessages: [],
      botInterval: null
    };
  },

  computed: {
    ...mapGetters({
      firstName: "user/firstName"
    }),

    isStillMessaging() {
      return this.unsentBotMessages.length > 0;
    }
  },

  created() {
    const botMessages = [
      {
        msg: `Hey ${this.firstName}! I'm the UPchieve Bot.`
      },
      {
        msg:
          "Right now we're searching for a live coach to pair you with. This process should only take 5-10 minutes, so please hang tight!"
      },
      {
        msg:
          "While you're waiting, you can save time by telling us what you need help with in the chat! You can also write out a problem you're working on on the whiteboard."
      }
    ];

    this.unsentBotMessages = botMessages;

    setTimeout(() => {
      this.showBotMessage();
      this.botInterval = setInterval(this.showBotMessage, 4500);
    }, 3000);
  },

  methods: {
    showBotMessage() {
      const newMessage = this.unsentBotMessages.shift();

      if (!newMessage) {
        return clearInterval(this.botInterval);
      }

      this.sentBotMessages.push(newMessage);
    }
  }
};
</script>

<style lang="scss" scoped>
.chat-bot {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.waiting-cards {
  width: 100%;
  padding: 20px 20px 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  &__card {
    text-align: left;
    position: relative;
    padding: 10px 14px;
    overflow-wrap: break-word;
    font-size: 16px;
    background: #67d3ab;
    border-radius: 20px;
    max-width: 80%;
    color: #fff;
    margin-bottom: 16px;

    p {
      margin: 0;
    }
  }
}

.typing-indicator {
  $ti-color-bg: #e6e7ed;
  background-color: $ti-color-bg;
  will-change: transform;
  width: auto;
  border-radius: 50px;
  padding: 14px;
  display: inline-block;
  margin: 0 0 0 20px;
  position: relative;

  span {
    height: 9px;
    width: 9px;
    float: left;
    margin: 0 2px;
    background-color: #9e9ea1;
    display: block;
    border-radius: 50%;
    opacity: 0.4;

    @for $i from 1 through 3 {
      &:nth-of-type(#{$i}) {
        animation: 1s blink infinite ($i * 0.3333s);
      }
    }
  }
}

@keyframes blink {
  50% {
    opacity: 1;
  }
}
</style>
