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
        <check-mark :checked="isComplete(cert.subjectsIncluded)" />
        <div class="training__cert-title">
          <span>{{ cert.displayName }}</span>
          <span
            class="training__status"
            :class="{
              'training__status--completed': isComplete(cert.subjectsIncluded)
            }"
            >{{ progressStatus(cert.subjectsIncluded) }}</span
          >
        </div>
      </div>

      <div
        :key="`subjects-${cert.displayName}-${index}`"
        class="training__subjects-included"
      >
        <span v-if="isLargeDevice" class="training__subjects-included--mobile"
          >Included subjects:</span
        >
        <span
          v-for="subject in cert.subjectsIncluded"
          :key="subject.displayName"
          class="training__subjects-included--subject"
          :class="{
            'training__subjects-included--completed':
              user.subjects.includes(subject.key) ||
              hasCompletedIncludedSubject(subject.key)
          }"
          >{{ subject.displayName }}</span
        >
      </div>
      <div :key="`empty-${index}`" />
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

export default {
  name: "AdditionalSubjectsDropDown",
  components: {
    CheckMark
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
    isComplete(includedSubjects) {
      return includedSubjects.every(subject => {
        let cert = subject.key;
        if (cert.match(/^algebra/i)) cert = "algebra";
        return this.user.certifications[cert].passed;
      });
    },
    progressStatus(includedSubjects) {
      if (this.isComplete(includedSubjects)) return "Completed";
      else return "Not started";
    },
    // Checks if a user has completed a quiz for a subject when the subject hasn't been added to the user's subject property yet
    hasCompletedIncludedSubject(subject) {
      let cert = subject;
      if (subject.match(/^algebra/i)) cert = "algebra";

      if (this.user.certifications[cert])
        return this.user.certifications[cert].passed;

      return false;
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
