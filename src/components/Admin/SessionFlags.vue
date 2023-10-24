<template>
  <ul class="flags-list">
    <li v-for="flag in flags" :key="flag">
      <Chip
        class="flags-item"
        :class="getFlagColor(flag)"
        :chipContent="flag"
      />
    </li>
  </ul>
</template>

<script>
import Case from 'case'
import Chip from '../Chip.vue'

const SESSION_FLAGS_CLASS = {
  absentStudent: 'flags-item--absent',
  absentVolunteer: 'flags-item--absent',
  commentFromStudent: 'flags-item--comment',
  commentFromVolunteer: 'flags-item--comment',
  pressuringCoach: 'flags-item--pressuringCoach',
  meanOrInappropriate: 'flags-item--mean-or-inappropriate',
  reported: 'flags-item--reported',
  lowCoachRatingFromStudent: 'flags-item--student-coach-rating',
  lowSessionRatingFromStudent: 'flags-item--student-session-rating',
  lowSessionRatingFromCoach: 'flags-item--volunteer-session-rating',
  pii: 'flags-item--personal-identifying-info',
  gradedAssignment: 'flags-item--graded-assignment',
  coachUncomfortable: 'flags-item--coach-uncomfortable',
  studentInDistress: 'flags-item--student-in-distress',
}

export default {
  name: 'SessionFlags',
  props: {
    flags: Array,
  },
  methods: {
    getFlagColor(flag) {
      return (
        SESSION_FLAGS_CLASS[Case.camel(flag)] || SESSION_FLAGS_CLASS.reported
      )
    },
  },
  components: { Chip },
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
  margin-top: 1em;
  margin-right: 1em;
  color: #fff;
  border: 0px;
  font-weight: bold;

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
  &--pressuringCoach {
    background-color: rgba($color: $c-sat, $alpha: 0.9);
  }
  &--mean-or-inappropriate {
    background-color: $c-math;
  }
  &--student-coach-rating {
    background-color: #c3ce87;
  }
  &--personal-identifying-info {
    background-color: $c-college;
  }
  &--graded-assignment {
    background-color: #feb4f1;
  }
  &--coach-uncomfortable {
    background-color: #2d3a55;
  }
  &--student-in-distress {
    background-color: #e75f5f;
  }
}
</style>
