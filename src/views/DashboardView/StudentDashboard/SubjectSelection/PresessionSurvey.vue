<template>
  <div class="presession-survey">
    <div class="presession-survey__title">
      Tell us a little about your request
    </div>
    <div class="presession-survey__subtitle">
      This info will help us find the best coach to pair you with
    </div>

    <div v-for="question in questions" :key="question.title" class="question">
      <div class="question__title">{{ question.title }}</div>
      <div class="question__options">
        <div
          v-for="option in question.options"
          :key="option.key"
          class="question__option"
        >
          <label>
            <input
              v-model="responses[question.key].answer"
              type="radio"
              :name="`${question.key}_${option.key}`"
              :value="option.key"
            />
            <span>{{ option.displayName }}</span>
            <input
              v-if="option.key === 'other'"
              :disabled="responses[question.key].answer !== 'other'"
              type="text"
              v-model="responses[question.key].other"
            />
          </label>
        </div>
      </div>
    </div>

    <large-button primary @click.native="submitSurvey" :disabled="!isComplete"
      >Start a chat</large-button
    >
  </div>
</template>

<script>
import LargeButton from "@/components/LargeButton";

const questions = [
  {
    title: "What is your primary goal for today's session?",
    key: "primary-goal",
    options: [
      {
        displayName: "Solve a specific question",
        key: "specific-question"
      },
      {
        displayName: "Complete a homework assignment",
        key: "complete-homework"
      },
      {
        displayName: "Prepare for a quiz/test",
        key: "test-prep"
      },
      {
        displayName: "Check my answers",
        key: "check-answers"
      },
      {
        displayName: "Improve my understanding of a topic",
        key: "improve-understanding"
      },
      {
        displayName: "Other",
        key: "other"
      }
    ]
  },
  {
    title:
      "What is your level of understanding of the topic you need support with?",
    key: "topic-understanding",
    options: [
      {
        displayName: "I don't know how to do this at all.",
        key: "not-at-all"
      },
      {
        displayName: "I think I know how to do it, but I need help.",
        key: "need-some-help"
      },
      {
        displayName:
          "I can do this on my own, but I don't fully understand it.",
        key: "can-do-it"
      },
      {
        displayName: "Check my answers",
        key: "very-confident"
      }
    ]
  }
];

export default {
  components: { LargeButton },

  data() {
    return {
      questions,
      responses: {
        "primary-goal": {
          answer: ""
        },
        "topic-understanding": {
          answer: ""
        }
      }
    };
  },

  computed: {
    isComplete() {
      return (
        !!this.responses["primary-goal"].answer &&
        !!this.responses["topic-understanding"].answer
      );
    }
  },

  methods: {
    submitSurvey() {
      this.$store.dispatch("user/updatePresessionSurvey", this.responses);
      this.$emit("survey-completed");
    }
  }
};
</script>

<style lang="scss" scoped>
.presession-survey {
  height: 100%;
  width: 100%;
  padding: 30px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;

  &__title {
    font-weight: 500;
    font-size: 24px;
    line-height: 1.25;
  }

  &__subtitle {
    color: $c-secondary-grey;
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 10px;
  }

  .LargeButton-primary {
    max-width: 175px;
    margin-top: 15px;
  }
}

.question {
  align-self: stretch;
  margin: 7px 20px;

  &__title {
    margin-bottom: 5px;
    text-align: left;
    font-weight: 500;
    color: $c-secondary-grey;
  }

  &__options {
    text-align: left;
    padding-left: 15px;
  }

  &__option {
    label {
      font-weight: 400;
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: flex-start;
      font-size: 13px;
    }

    input[type=radio] {
      margin: 0 8px 0 0;
    }

    input[type=text] {
      margin: 0 0 0 10px;
      width: 250px;
    }
  }
}
</style>
