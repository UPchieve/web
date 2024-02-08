<template>
  <div class="survey-responses">
    <div
      v-for="(question, key, index) in this.responsesGroupedByQuestion"
      v-bind:key="index"
    >
      <strong>
        <div v-if="isFreeResponse(key)">
          Your Thoughts
        </div>
        <div v-else>
          {{ key }}
        </div>
      </strong>
      <div v-for="(response, indexInner) in question" v-bind:key="indexInner">
        <div v-if="isSessionRating(key)" class="feedback-preview__star-rating">
          <vue-star-rating
            v-model="response.score"
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
        {{ response.response }}
      </div>
    </div>
  </div>
</template>

<script>
import { groupBy } from 'lodash-es'

export default {
  name: 'SurveyResponsePreview',

  props: {
    response: Array,
  },

  computed: {
    responsesGroupedByQuestion() {
      return groupBy(this.response, 'displayLabel')
    },
  },
  methods: {
    isSessionRating(questionText) {
      return (
        questionText.endsWith('achieve your goal?') ||
        questionText.endsWith('achieve their goal?')
      )
    },
    isFreeResponse(questionText) {
      return questionText.startsWith('This can be about the web app,')
    },
  },
}
</script>

<style lang="scss" scoped>
.survey-responses {
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
