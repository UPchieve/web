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
      {{ partnerRating.name }}: <strong>{{ partnerRating.value }}/5</strong>
    </div>
    <div v-if="writtenFeedback" class="feedback-preview__written">
      {{ writtenFeedback }}
    </div>
  </div>
</template>

<script>
import { get } from "lodash";

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

    partnerRatings() {
      const path =
        get(this.feedback, "userType") === "student"
          ? "responseData.coach-ratings"
          : "responseData.session-experience";
      const ratings = get(this.feedback, path, {});
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
