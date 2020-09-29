<template>
  <div class="presession-survey">
    <div class="presession-survey__title">
      Tell us a little about your request
    </div>
    <div class="presession-survey__subtitle">
      This info will help us find the best coach to pair you with
    </div>

    <div class="questions-container">
      <div v-for="question in questions" :key="question.title" class="question">
        <div class="question__title">{{ question.title }}</div>
        <div class="question__options">
          <div
            v-for="option in question.options"
            :key="option.displayName"
            class="question__option"
          >
            <input
              v-model="responses[question.key].answer"
              type="radio"
              :id="`${question.key}_${option.value}`"
              :value="option.value"
            />
            <label :for="`${question.key}_${option.value}`">
              <span>{{ option.displayName }}</span>
              <input
                v-if="option.value === 'other'"
                type="text"
                v-model="responses[question.key].other"
                :disabled="responses[question.key].answer !== 'other'"
              />
            </label>
          </div>
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
        value: "specific-question"
      },
      {
        displayName: "Complete a homework assignment",
        value: "complete-homework"
      },
      {
        displayName: "Prepare for a quiz/test",
        value: "test-prep"
      },
      {
        displayName: "Check my answers",
        value: "check-answers"
      },
      {
        displayName: "Improve my understanding of a topic",
        value: "improve-understanding"
      },
      {
        displayName: "Other",
        value: "other"
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
        value: 1
      },
      {
        displayName: "I think I know how to do it, but I need help.",
        value: 2
      },
      {
        displayName:
          "I can do this on my own, but I don't fully understand it.",
        value: 3
      },
      {
        displayName: "I am very comfortable with this topic.",
        value: 4
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
    margin: 15px 0;
  }
}

.questions-container {
  overflow-y: scroll;

  @include breakpoint-above("medium") {
    height: 321px;
  }
}

.question {
  align-self: stretch;
  margin: 15px 20px 35px;

  &__title {
    margin-bottom: 5px;
    text-align: left;
    font-weight: 500;
    color: $c-secondary-grey;
    font-size: 18px;
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
      font-size: 16px;

      &:before {
        content: "";
        display: inline-block;
        width: 24px;
        height: 24px;
        padding: 3px;
        background-clip: content-box;
        border: 1px solid #77778B;
        border-radius: 50%;
        margin-right: 8px;
      }
    }

    input[type="radio"] {
      display: none;

      &:checked + label:before {
        background-color: #16D2AA;
        border: 1px solid #16D2AA;
      }
    }

    input[type="text"] {
      margin: 0 0 0 10px;
      width: 250px;
    }
  }
}
</style>
