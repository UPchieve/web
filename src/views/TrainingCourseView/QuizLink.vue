<template>
  <div class="quiz-link" :class="statusClass">
    <div class="quiz-link__cell" @click="onClick">
      <check-mark class="quiz-link__icon" :checked="isCompleted" />
      <div class="quiz-link__left">
        <div class="quiz-link__name">{{ quizName }}</div>
        <div class="quiz-link__status">{{ statusText }}</div>
      </div>
      <div class="quiz-link__right">
        <right-caret class="quiz-link__caret" />
      </div>
    </div>
  </div>
</template>

<script>
import CheckMark from "@/components/CheckMark";
import RightCaret from "@/assets/right-caret.svg";

export default {
  components: {
    CheckMark,
    RightCaret
  },
  props: {
    quizKey: String,
    quizName: String,
    certification: Object,
    isDisabled: Boolean
  },
  computed: {
    isCompleted() {
      return this.certification.passed;
    },
    isStarted() {
      return this.certification.tries > 0;
    },
    statusClass() {
      if (this.isDisabled) return "quiz-link--disabled";
      else if (this.isCompleted) return "quiz-link--completed";
      else if (this.isStarted) return "quiz-link--started";
      return "quiz-link--not-started";
    },
    statusText() {
      if (this.isDisabled) return "Locked";
      else if (this.isCompleted) return "Completed";
      else if (this.isStarted) return "In progress";
      return "Not started";
    }
  },
  methods: {
    onClick() {
      if (this.isDisabled || this.isCompleted) return;
      else this.$router.push(`/training/${this.quizKey}/quiz`);
    }
  }
};
</script>

<style lang="scss" scoped>
.quiz-link {
  color: $c-soft-black;
  margin-top: -1px;

  &__cell {
    display: flex;
    flex-direction: row;
    border: solid 1px $c-border-grey;
    padding: 10px 30px;
    align-items: center;
    justify-content: flex-start;
    cursor: pointer;
  }

  &__icon {
    flex-shrink: 0;
  }

  &__left {
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    margin-left: 20px;

    // See: https://css-tricks.com/flexbox-truncated-text/
    min-width: 0;
  }

  &__name {
    font-size: 18px;
    margin-bottom: -3px;
    text-align: left;
    width: 100%;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding-right: 10px;
  }

  &__status {
    color: $c-secondary-grey;
  }

  &__right {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &--disabled {
    .quiz-link__cell {
      cursor: default;
    }

    .quiz-link__caret {
      display: none;
    }

    .quiz-link__name {
      color: $c-secondary-grey;
    }
  }

  &--completed {
    .quiz-link__status {
      color: $c-success-green;
    }

    .quiz-link__cell {
      cursor: default;
    }

    .quiz-link__caret {
      display: none;
    }
  }

  &--started {
    .quiz-link__status {
      color: $c-warning-orange;
    }
  }
}
</style>
