<template>
  <ul class="flags-list">
    <li
      v-for="flag in flags"
      :key="flag"
      class="flags-item"
      :class="getFlagColor(flag)"
    >
      {{ formatFlag(flag) }}
    </li>
  </ul>
</template>

<script>
import { capitalize } from "lodash";

const SESSION_FLAGS_CLASS = {
  ABSENT_USER: "flags-item--absent-user",
  COMMENT: "flags-item--comment",
  FIRST_TIME_VOLUNTEER: "flags-item--first-time-volunteer",
  FIRST_TIME_STUDENT: "flags-item--first-time-student",
  LOW_MESSAGES: "flags-item--low-messages",
  REPORTED: "flags-item--reported",
  STUDENT_RATING: "flags-item--student-rating",
  VOLUNTEER_RATING: "flags-item--volunteer-rating",
  UNMATCHED: "flags-item--unmatched"
};

export default {
  name: "SessionFlags",

  props: {
    flags: Array
  },
  methods: {
    formatFlag(flag) {
      const delimiter = /_/gi;
      return capitalize(flag.replace(delimiter, " ").toLowerCase());
    },
    getFlagColor(flag) {
      return SESSION_FLAGS_CLASS[flag] || "";
    }
  }
};
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

  &--volunteer-rating {
    background-color: darken($c-backdrop, 20%);
  }
  &--student-rating {
    background-color: $c-warning-orange;
  }
  &--comment {
    background-color: $c-accent;
  }
  &--reported {
    background-color: rgba($color: $c-error-red, $alpha: 0.9);
  }
  &--absent-user {
    background-color: #fdab3d;
  }
  &--first-time-student {
    background-color: rgba($color: $c-sat, $alpha: 0.9);
  }
  &--first-time-volunteer {
    background-color: $c-math;
  }
  &--low-messages {
    background-color: #c3ce87;
  }
  &--unmatched {
    background-color: $c-shadow;
  }
}
</style>
