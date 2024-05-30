<template>
  <div class="training">
    <template v-if="!isSmallDevice">
      <h3 class="training__header" v-for="header in headers" :key="header">
        {{ header }}
      </h3>
    </template>

    <template
      v-for="cert in certData"
      :key="`additional-subjects-${cert.displayName}`"
    >
      <div class="training__cert">
        <check-mark :checked="isComplete(cert)" />
        <div class="training__cert-title">
          <span>{{ cert.displayName }}</span>
          <span
            class="training__status"
            :class="{
              'training__status--completed': isComplete(cert),
            }"
            >{{ progressStatus(cert) }}</span
          >
        </div>
      </div>

      <div class="training__subjects-unlocked">
        <span
          v-if="isSmallDevice"
          class="training__subjects-unlocked--mobile"
          >{{ certColumnTitle }}</span
        >
        <span
          v-for="subject in cert.subjectsIncluded"
          :key="subject.displayName"
          class="training__subjects-unlocked--subject"
          >{{ subject.displayName }}</span
        >
      </div>
      <div />
      <div class="training__row-border" />
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import CheckMark from '@/components/CheckMark.vue'

export default {
  name: 'AdditionalSubjectsDropDown',
  components: {
    CheckMark,
  },
  props: {
    headers: {
      type: Array,
      required: true,
    },
    certData: {
      type: Array,
      required: true,
    },
    trainingCourse: {
      type: Boolean,
    },
    dropDownType: {
      type: String,
      default: 'unlocking',
    },
  },

  computed: {
    ...mapState({
      user: (state) => state.user.user,
      windowWidth: (state) => state.app.windowWidth,
    }),
    isSmallDevice() {
      const largeScreenBreakpoint = 992

      return this.windowWidth <= largeScreenBreakpoint
    },
    certColumnTitle() {
      if (this.dropDownType === 'computed') return 'Required Certifications:'
      else return 'Alternative Certifications:'
    },
  },

  methods: {
    isComplete(cert) {
      if (this.dropDownType === 'computed')
        return cert.subjectsIncluded.every((subject) =>
          this.user.subjects.includes(subject.key)
        )
      else return this.user.subjects.includes(cert.key)
    },
    progressStatus(cert) {
      if (this.isComplete(cert)) return 'Unlocked'
      else return 'Locked'
    },
  },
}
</script>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}
</style>
