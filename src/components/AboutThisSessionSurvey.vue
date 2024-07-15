<template>
  <div class="about-this-session-survey">
    <div
      :class="{
        'alert alert-info': !complete,
        'alert alert-success': complete,
      }"
    >
      <span v-if="complete" data-testid="completed-message"
        >Thank you for your feedback!</span
      >
      <span v-else data-testid="feedback-prompt"
        >Please help us improve this page by answering a few questions:</span
      >
    </div>
    <div v-if="!complete">
      <div class="question-1" data-testid="question-1">
        <span class="question-text">Is this information helpful?</span>
        <div class="question-1">
          <div class="question-1--options">
            <ThumbsUpDownButtons
              :onClickThumbsUp="() => submitRating(1)"
              :onClickThumbsDown="() => submitRating(-1)"
            />
          </div>
        </div>
      </div>
      <div
        class="question-2"
        v-if="question1Complete"
        ref="question2"
        data-testid="question-2"
      >
        <span class="question-text"
          >What made you choose {{ ratingEmoji }}?</span
        >
        <textarea
          class="comments-textarea"
          v-model="comments"
          ref="commentsTextArea"
          data-testid="comments-textarea"
        />
        <large-button
          primary
          @click="submitComments"
          data-testid="submit-feedback-btn"
          >Submit</large-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import { nextTick } from 'vue'
import { EVENTS } from '@/consts'
import ThumbsUpDownButtons from '@/components/ThumbsUpDownButtons.vue'

export default {
  name: 'about-this-session-survey',
  components: { ThumbsUpDownButtons, LargeButton },
  async mounted() {
    AnalyticsService.captureEvent(EVENTS.USER_SHOWN_ABOUT_THIS_SESSION_SURVEY, {
      ...this.generalEventProperties,
    })
  },
  data() {
    return {
      comments: null,
      complete: false,
      question1Complete: false,
      rating: 0,
    }
  },
  methods: {
    async submitRating(val) {
      this.rating = val
      AnalyticsService.captureEvent(EVENTS.SELECTED_ABOUT_THIS_SESSION_RATING, {
        ...this.generalEventProperties,
        rating: val,
      })
      this.question1Complete = true
      await nextTick()
      this.$refs.question2.scrollIntoView({ behavior: 'smooth' })
      this.$refs.commentsTextArea.focus()
    },
    submitComments() {
      AnalyticsService.captureEvent(
        EVENTS.SUBMITTED_ABOUT_THIS_SESSION_COMMENTS,
        {
          ...this.generalEventProperties,
          comments: this.comments,
        }
      )
      this.complete = true
    },
  },
  computed: {
    sessionId() {
      return this.$route.params.sessionId
    },
    generalEventProperties() {
      return {
        sessionId: this.sessionId,
      }
    },
    ratingEmoji() {
      return this.rating === 0
        ? 'that response'
        : this.rating === 1
          ? '👍'
          : '👎'
    },
  },
}
</script>

<style lang="scss" scoped>
.about-this-session-survey {
  display: flex;
  flex-direction: column;
  padding: 5% 5% 5% 5%;
}

.question-1 {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  &--options {
    display: flex;
    flex-direction: row;
    gap: 25px;
  }
}
.question-2 {
  padding-top: 16px;
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  gap: 8px;
}

.comments-textarea {
  width: 100%;
  height: 120px;
  border: 1px solid $c-border-grey;
  border-radius: 5px;
  padding: 1em;
  resize: none;
  &:focus {
    outline: none;
    border-color: $c-success-green;
  }
}
</style>
