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
    <div v-if="writtenFeedback" class="feedback-preview__written">
      {{ writtenFeedback }}
    </div>
    <div v-if="coachFeedback" class="feedback-preview__written">
      Feedback on coach: {{ coachFeedback }}
    </div>
  </div>
</template>

<script>
import { get, isEmpty } from "lodash";

export default {
  name: "FeedbackPreview",

  props: {
    feedback: Object
  },

  computed: {
    sessionRating() {
      return get(this.feedback, "responseData.rate-session.rating", null);
    },

    writtenFeedback() {
      return get(this.feedback, "responseData.other-feedback", null);
    },

    coachFeedback() {
      return get(this.feedback, "responseData.coach-feedback", null);
    },

    subjectUnderstanding() {
      const subjectUnderstandingDisplay = [
        "I don’t know how to do this at all.",
        "I think I know how to do it, but I need help.",
        "I can do this with help.",
        "I can do this on my own.",
        "I’m very confident"
      ];
      const path = get(
        this.feedback,
        "responseData.subject-understanding",
        null
      );
      if (path) return subjectUnderstandingDisplay[path];
      return "";
    },

    partnerRatings() {
      const isStudent = get(this.feedback, "userType") === "student";
      let path = isStudent
        ? "responseData.coach-ratings"
        : "responseData.session-experience";
      let ratings = get(this.feedback, path, {});

      if (isStudent && isEmpty(ratings))
        ratings = get(this.feedback, "responseData", {});

      return Object.keys(ratings).map(r => ({
        name: r,
        value: ratings[r]
      }));
    }
  }
};
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
}
</style>
