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
            <button
              @click="submitRating(-1)"
              class="thumbs-down"
              :class="{ 'selected-rating-btn': rating === -1 }"
              data-testid="low-rating-btn"
            >
              <ThumbsDownIcon />
            </button>
            <button
              @click="submitRating(1)"
              class="thumbs-up"
              :class="{ 'selected-rating-btn': rating === 1 }"
              data-testid="high-rating-btn"
            >
              <ThumbsUpIcon />
            </button>
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
import ThumbsUpIcon from '@/assets/thumbs-up.svg'
import ThumbsDownIcon from '@/assets/thumbs-down.svg'
import { nextTick } from 'vue'
import { EVENTS } from '@/consts'

export default {
  name: 'about-this-session-survey',
  components: { LargeButton, ThumbsDownIcon, ThumbsUpIcon },
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

  button {
    width: 60px;
    height: 60px;
    svg {
      width: 50px;
      height: 50px;
      margin: auto;
    }
  }

  .selected-rating-btn {
    transform: scale(1.1);
    border: 1px solid $c-soft-black;
  }

  .thumbs-up {
    background-color: rgba($c-success-green, 0.5);
    border-radius: 50%;
    svg {
      padding-bottom: 5px;
    }

    &:hover {
      transform: scale(1.1);
      background-color: lighten($c-success-green, 5%);
    }
  }

  .thumbs-down {
    background-color: rgba($c-error-red, 0.5);
    border-radius: 50%;
    svg {
      padding-top: 5px;
    }

    &:hover {
      transform: scale(1.1);
      background-color: lighten($c-error-red, 5%);
    }
  }

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
