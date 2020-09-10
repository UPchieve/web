<template>
  <div class="training">
    <template v-if="!isLargeDevice">
      <h3 class="training__header" v-for="header in headers" :key="header">
        {{ header }}
      </h3>
    </template>

    <template v-for="(cert, index) in certData">
      <div
        class="training__cert"
        :key="`cert-title-${cert.displayName}-${index}`"
      >
        <check-mark
          :checked="isComplete(cert.key) || hasUnlockedSubject(cert.key)"
        />
        <div class="training__cert-title">
          <span>{{ cert.displayName }}</span>
          <span
            class="training__status"
            :class="{
              'training__status--completed': isComplete(cert.key),
              'training__status--unlocked': hasUnlockedSubject(cert.key)
            }"
            >{{ progressStatus(cert.key) }}</span
          >
        </div>
      </div>

      <div
        :key="`subjects-${cert.displayName}-${index}`"
        class="training__subjects-unlocked"
      >
        <span v-if="isLargeDevice" class="training__subjects-unlocked--mobile"
          >Subjects Unlocked:</span
        >
        <span
          v-for="subject in cert.subjectsIncluded"
          :key="subject.displayName"
          class="training__subjects-unlocked--subject"
          >{{ subject.displayName }}</span
        >
      </div>

      <div class="action-btns" :key="`action-btns-${index}`">
        <router-link
          :to="`/training/review/${cert.key}`"
          class="action-btns__review-link"
        >
          <span class="action-btns__review-link--text">Review</span>
          <arrow-icon class="action-btns__review-link--arrow-icon" />
        </router-link>

        <large-button
          primary
          :showArrow="false"
          :routeTo="
            !isComplete(cert.key) || hasUnlockedSubject(cert.key)
              ? `/training/${cert.key}/quiz`
              : null
          "
          class="action-btns__quiz-btn"
          :disabled="isComplete(cert.key) || hasUnlockedSubject(cert.key)"
        >
          <span>{{ actionButtonText(cert.key) }}</span>
        </large-button>
      </div>

      <div
        :key="`border-${cert.displayName}-${index}`"
        class="training__row-border"
      />
    </template>
  </div>
</template>

<script>
import { mapState } from "vuex";
import CheckMark from "@/components/CheckMark";
import LargeButton from "@/components/LargeButton";
import ArrowIcon from "@/assets/arrow.svg";

export default {
  name: "SubjectCertsDropDown",
  components: {
    CheckMark,
    LargeButton,
    ArrowIcon
  },
  props: {
    headers: {
      type: Array,
      required: true
    },
    certData: {
      type: Array,
      required: true
    },
    trainingCourse: {
      type: Boolean
    }
  },

  computed: {
    ...mapState({
      user: state => state.user.user,
      windowWidth: state => state.app.windowWidth
    }),
    isLargeDevice() {
      const largeScreenBreakpoint = 992;

      return this.windowWidth <= largeScreenBreakpoint;
    }
  },

  methods: {
    isComplete(cert) {
      return this.user.certifications[cert].passed;
    },
    hasUnlockedSubject(cert) {
      if (cert === "algebra") return this.user.subjects.includes("algebraOne");
      return this.user.subjects.includes(cert);
    },
    progressStatus(cert) {
      if (this.isComplete(cert)) return "Completed";
      if (this.hasUnlockedSubject(cert)) return "Unlocked";
      else return "Not started";
    },
    actionButtonText(cert) {
      if (this.isComplete(cert) || this.hasUnlockedSubject(cert))
        return "Completed";
      else return "Start quiz";
    }
  }
};
</script>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}
</style>
