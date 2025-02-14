<template>
  <div class="container">
    <span
      class="cross-icon-click-container"
      @click="cancel()"
      data-testid="survey-container"
    >
      <cross-icon class="cross-icon" />
    </span>
    <div class="presession-survey">
      <div class="presession-survey__title">
        Would you like an AI or Human tutor?
      </div>

      <div class="container">
        <div class="choices">
          <large-button
            class="choice bot"
            :routeTo="
              subject
                ? `/ai-tutor-conversations?subject=${subject}`
                : '/ai-tutor-conversations'
            "
            @click="chooseAi"
            :showArrow="false"
            data-testid="presession-next-button"
          >
            <div class="avatar-background">
              <chat-bot-icon class="avatar" />
            </div>
            <div class="choice-title">AI Tutor</div>
          </large-button>
          <large-button
            class="choice human"
            :showArrow="false"
            data-testid="presession-submit"
            @click="chooseHuman"
          >
            <div class="avatar-background">
              <volunteer-icon class="avatar" />
            </div>
            <div class="choice-title">Human Tutor</div>
          </large-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import LargeButton from '@/components/LargeButton.vue'
import CrossIcon from '@/assets/cross.svg'
import VolunteerIcon from '@/assets/user_avatars/volunteer-icon.svg'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export default {
  components: {
    LargeButton,
    CrossIcon,
    ChatBotIcon,
    VolunteerIcon,
  },
  props: {
    subject: {
      type: String,
      required: false,
    },
  },

  data() {
    return {
      unsubscribe: null,
      exitMethod: null,
    }
  },

  mounted() {
    AnalyticsService.captureEvent(EVENTS.USER_SAW_TUTOR_CHOICE)
    this.$store.dispatch('app/modal/update', { showTemplateButtons: false })
    this.unsubscribe = this.$store.subscribeAction((action) => {
      if (action.type === 'app/modal/hide' && !this.exitMethod) {
        AnalyticsService.captureEvent(EVENTS.USER_CLOSED_TUTOR_CHOICE)
      }
    })
  },

  beforeUnmount() {
    this.unsubscribe()
    this.$store.dispatch('app/modal/update', { showTemplateButtons: true })
  },

  emits: ['choose-human'],
  methods: {
    chooseHuman() {
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_HUMAN_TUTOR)
      this.exitMethod = 'human'
      this.$emit('choose-human')
    },
    chooseAi() {
      this.exitMethod = 'ai'
      AnalyticsService.captureEvent(EVENTS.USER_CLICKED_AI_TUTOR)
    },
    cancel() {
      this.$store.dispatch('app/modal/hide')
    },
  },
}
</script>

<style lang="scss" scoped>
.container {
  @include flex-container(column);
}
.avatar {
  width: 120px;
  height: 120px;
}
.choices {
  display: flex;
  flex-direction: row;
  justify-content: space-evenly;
  padding: 24px 0;
  gap: 24px;
}
.choice {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 0;
  border-radius: 8px;
  overflow: hidden;
  border: none;
  box-shadow: 0px 4px 10px 0px rgba(0, 0, 0, 0.2);
  transition: top 0.2s ease-in-out;
  text-decoration: none;
  position: relative;
  top: 0;
  width: 188px;
}
.choice:hover {
  top: -5px;
}

.choice > :deep(div),
.choice > :deep(span) {
  width: 100%;
}

.avatar-background {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 12px;
}

.bot {
  .avatar-background {
    background-color: rgb(22 210 170);
  }
}
.human {
  .avatar-background {
    background-color: rgb(118 229 253);
  }
}

.choice-title {
  text-align: center;
  background-color: white;
  padding: 12px;
}

.presession-survey {
  width: 100%;
  display: flex;
  flex-direction: column;
  text-align: left;

  &__title {
    font-weight: 500;
    @include font-category('display-small');
    margin: 0.5em 0;
    color: $c-soft-black;
  }
}

.cross-icon-click-container {
  cursor: pointer;
  align-self: flex-end;
}
.cross-icon {
  fill: $icon-grey;
  width: 15px;
  height: 15px;
}
</style>
