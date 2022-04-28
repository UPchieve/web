<template>
  <div class="feedback-preview">
    <div v-if="sessionRating" class="feedback-preview__star-rating">
      <vue-star-rating
        v-model="sessionRating"
        inactive-color="#ffffff"
        active-color="#36d2aa"
        border-color="#36d2aa"
        :read-only="true"
        :border-width="2"
        :star-size="18"
        :padding="1"
        :show-rating="false"
      />
    </div>
    <div
      v-for="partnerRating in partnerRatings"
      :key="partnerRating.name"
      class="feedback-preview__rating"
    >
      <template v-if="partnerRating.name === 'subject-understanding'">
        {{ partnerRating.name }}: <strong>{{ subjectUnderstanding }}</strong>
      </template>
      <template v-else-if="Number(partnerRating.value)">
        {{ partnerRating.name }}: <strong>{{ partnerRating.value }}/5</strong>
      </template>
    </div>
    <template v-if="!isStudentFeedback">
      <div v-for="feedback in volunteerFeedback" :key="feedback.key">
        <p v-if="feedback.value">
          {{ feedback.key }}:
          <span class="feedback-preview__value">{{ feedback.value }}</span>
        </p>
      </div>
    </template>
    <div v-if="writtenFeedback" class="feedback-preview__written">
      {{ writtenFeedback }}
    </div>
    <div v-if="isStudentFeedback && coachFeedback" class="feedback-preview__written">
      Feedback on coach: {{ coachFeedback }}
    </div>
  </div>
</template>

<script>
import { get, isEmpty } from 'lodash'

export default {
  name: 'FeedbackPreview',

  props: {
    feedback: Object,
    userType: {
      type: String,
      required: true
    }
  },

  computed: {
    sessionRating() {
      const sessionRatingKeys = [
        'studentCounselingFeedback.rate-session.rating',
        'responseData.rate-session.rating'
      ]
      for (const sessionRatingKey of sessionRatingKeys) {
        const sessionRating = get(this.feedback, sessionRatingKey, null)
        if (sessionRating) return sessionRating
      }

      return ''
    },

    isStudentFeedback(){
      return this.userType === 'student'
    },

    writtenFeedback() {
      let otherFeedback = ''
      const studentFeedbackKeys = [
        'studentTutoringFeedback.other-feedback',
        'studentCounselingFeedback.other-feedback',
      ]
      const volunteerFeedbackKeys = [
        'volunteerFeedback.other-feedback',
      ]
      const legacyFeedbackKeys = [
        'responseData.other-feedback'
      ]
      if(this.isStudentFeedback)
        otherFeedback = this.getOtherFeedback([...studentFeedbackKeys, ...legacyFeedbackKeys])
      else otherFeedback = this.getOtherFeedback([...volunteerFeedbackKeys, ...legacyFeedbackKeys])
      
      return otherFeedback
    },

    coachFeedback() {
      return get(this.feedback, 'studentTutoringFeedback.coach-feedback', null)
    },

    subjectUnderstanding() {
      const subjectUnderstandingDisplay = [
        'I don’t know how to do this at all.',
        'I think I know how to do it, but I need help.',
        'I can do this with help.',
        'I can do this on my own.',
        'I’m very confident'
      ]
      const path = get(
        this.feedback,
        'studentTutoringFeedback.subject-understanding',
        null
      )
      if (path) return subjectUnderstandingDisplay[path]
      return ''
    },

    partnerRatings() {
      let path = ''
      if (this.isStudentFeedback) {
        if (this.feedback.versionNumber === 1)
          path = 'responseData.coach-ratings'
        else if (this.feedback.versionNumber === 2)
          path = 'studentCounselingFeedback.coach-ratings'
      } else path = 'responseData.session-experience'
      let ratings = get(this.feedback, path, {})

      if (this.isStudentFeedback && isEmpty(ratings)) {
        let updatedPath = 'responseData'
        if (
          this.feedback.versionNumber === 2 &&
          this.feedback.type !== 'college'
        )
          updatedPath = 'studentTutoringFeedback'
        else if (
          this.feedback.versionNumber === 2 &&
          this.feedback.type === 'college'
        )
          updatedPath = 'studentCounselingFeedback'
        ratings = get(this.feedback, updatedPath, {})
      }

      if (isEmpty(ratings)) return []

      return Object.keys(ratings).map(r => ({
        name: r,
        value: ratings[r]
      }))
    },

    volunteerFeedback() {
      if (this.feedback.volunteerFeedback) {
        const feedbackData = Object.entries(this.feedback.volunteerFeedback)
        const formattedFeedbackData = feedbackData.map(([key, value]) => {
          if (key === 'session-obstacles')
            return { key, value: this.volunteerSessionObstacles }
          if (key === 'student-understanding')
            return { key, value: this.volunteerStudentUnderstanding }
          if (key === 'other-feedback') return {}
          return {
            key,
            value
          }
        })

        return formattedFeedbackData
      }
      return []
    },

    volunteerSessionObstacles() {
      const options = [
        'Website/app didn’t fully work',
        'We ran out of time',
        'The student was too far behind',
        'The student didn’t want to participate',
        'The student requested the wrong subject',
        'There was a gap in my own knowledge',
        'The student was rude or inappropriate',
        'The student was only looking for answers'
      ]
      return options
        .filter((_, index) =>
          this.feedback.volunteerFeedback['session-obstacles'].includes(
            index + 1
          )
        )
        .join('. ')
    },

    volunteerStudentUnderstanding() {
      const options = [
        "They don't know how to do this at all",
        'They have a sense of how to do it, but they still need some help.',
        'They can do this on their own, but they don’t fully understand it.',
        'They are very comfortable with the topic.',
        'N/A - I couldn’t tell.'
      ]
      return options[
        this.feedback.volunteerFeedback['student-understanding'] - 1
      ]
    }
  },
  methods: {
    getOtherFeedback(otherFeedbackKeys){
      for (const feedbackKey of otherFeedbackKeys) {
        const otherFeedback = get(this.feedback, feedbackKey, null)
        if (otherFeedback) return otherFeedback
      }
      return ''
    }
  }
}
</script>

<style lang="scss" scoped>
.feedback-preview {
  color: #000;
  font-size: 14px;
  text-align: left;
  margin: 7px 0;

  &__star-rating {
    margin-bottom: 7px;
  }

  &__rating {
    margin-bottom: 10px;
  }

  &__written {
    border-left: solid #ececec 5px;
    padding: 3px 0 3px 8px;
  }

  &__value {
    font-weight: 600;
  }
}
</style>
