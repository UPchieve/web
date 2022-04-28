<template>
  <ul class="flags-list">
    <li
      v-for="flag in flags"
      :key="flag"
      class="flags-item"
      :class="getFlagColor(flag)"
    >
      {{ flag }}
    </li>
  </ul>
</template>

<script>
import Case from 'case'

const SESSION_FLAGS_CLASS = {
  absentStudent: 'flags-item--absent',
  absentVolunteer: 'flags-item--absent',
  commentFromStudent: 'flags-item--comment',
  commentFromVolunteer: 'flags-item--comment',
  onlyLookingForAnswers: 'flags-item--only-looking-for-answers',
  rudeOrInappropriate: 'flags-item--rude-or-inappropriate',
  reported: 'flags-item--reported',
  lowCoachRatingFromStudent: 'flags-item--student-coach-rating',
  lowSessionRatingFromStudent: 'flags-item--student-session-rating',
  lowSessionRatingFromCoach: 'flags-item--volunteer-session-rating'
}

export default {
  name: 'SessionFlags',

  props: {
    flags: Array
  },
  methods: {
    getFlagColor(flag) {
      return SESSION_FLAGS_CLASS[Case.camel(flag)] || ''
    }
  }
}
</script>

<style lang="scss" scoped>
.flags-list {
  @include flex-container(row, flex-start, center);
  flex-flow: row wrap;
  list-style-type: none;
  padding-left: 0;
}

.flags-item {
  margin-right: 1em;
  color: #fff;
  padding: 0.5em 1em;
  border-radius: 100px;
  margin-top: 1em;
  font-size: 12px;

  &--volunteer-session-rating {
    background-color: darken($c-backdrop, 20%);
  }
  &--student-session-rating {
    background-color: $c-warning-orange;
  }
  &--comment {
    background-color: $c-accent;
  }
  &--reported {
    background-color: rgba($color: $c-error-red, $alpha: 0.9);
  }
  &--absent {
    background-color: #fdab3d;
  }
  &--only-looking-for-answers {
    background-color: rgba($color: $c-sat, $alpha: 0.9);
  }
  &--rude-or-inappropriate {
    background-color: $c-math;
  }
  &--student-coach-rating {
    background-color: #c3ce87;
  }
}
</style>
