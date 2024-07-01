<template>
  <button
    class="subject-card"
    :disabled="disabled"
    type="button"
    @click="handleSubjectClick"
  >
    <img
      :src="subject.topicIconLink"
      class="subject-card-icon"
      aria-hidden="true"
    />
    <span class="subject-card-title">{{ subject.displayName }}</span>
    <arrow-icon class="arrow-icon" />
  </button>
</template>

<script>
import { mapState } from 'vuex'
import ArrowIcon from '@/assets/arrow.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export default {
  name: 'recent-subject-card',
  components: { ArrowIcon },
  emits: ['subject-clicked'],
  props: {
    subject: {
      type: Object,
      required: true,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
  },
  methods: {
    handleSubjectClick() {
      AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_RECENT_SUBJECT)
      this.$emit('subject-clicked', this.subject)
    },
  },
}
</script>

<style lang="scss" scoped>
.subject-card {
  @include flex-container(row, space-between, center);
  background-color: $upchieve-white;
  border: 1px solid $border-grey;
  border-radius: 8px;
  cursor: pointer;
  padding: 1em 1.4em;

  &:hover:enabled {
    background-color: darken($selected-green, 0%);
    border: 1px solid $c-success-green;

    & .arrow-icon {
      visibility: initial;
      fill: $c-success-green;
    }
  }

  &:hover:disabled .arrow-icon {
    visibility: hidden;
  }

  &:disabled {
    opacity: 75%;
    cursor: default;
  }

  &-title {
    margin-left: 1em;
  }

  &-icon {
    position: relative;
    left: 0px;
    width: 40px;
    height: 40px;
  }
}

.arrow-icon {
  visibility: hidden;
  margin-left: 0.8em;
  width: 20px;
  height: 20px;
  width: 20%;
}
</style>
