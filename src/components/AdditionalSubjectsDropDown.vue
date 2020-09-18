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
        class="training__subjects-unlocked"
      >
        <span v-if="isLargeDevice" class="training__subjects-unlocked--mobile"
          >Required Certifications:</span
        >
        <span
          v-for="subject in cert.subjectsIncluded"
          :key="subject.displayName"
          class="training__subjects-unlocked--subject"
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
      return includedSubjects.every(subject =>
        this.user.subjects.includes(subject.key)
      );
    },
    progressStatus(includedSubjects) {
      if (this.isComplete(includedSubjects)) return "Unlocked";
      else return "Locked";
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
