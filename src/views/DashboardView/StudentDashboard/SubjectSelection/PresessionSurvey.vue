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
              tabindex="-1"
              :id="`${question.key}_${option.value}`"
              :value="option.value"
            />
            <label
              :for="`${question.key}_${option.value}`"
              tabindex="0"
              @keydown.space="responses[question.key].answer = option.value"
            >
              <span>{{ option.displayName }}</span>
              <input
                v-if="option.value === 'other'"
                type="text"
                tabindex="-1"
                v-model="responses[question.key].other"
                :disabled="responses[question.key].answer !== 'other'"
              />
            </label>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!mobileMode" class="presession-survey__separator" />
    <div class="presession-survey__buttons">
      <large-button @click.native="cancel()">Cancel</large-button>
      <large-button primary @click.native="submitSurvey" :disabled="!isComplete"
        >Start a chat</large-button
      >
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
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
    ...mapGetters({ mobileMode: "app/mobileMode" }),
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
    },
    cancel() {
      this.$store.dispatch("app/modal/hide");
    }
  }
};
</script>

<style lang="scss" scoped>
.presession-survey {
  height: 100%;
  width: 100%;
  padding: 40px 20px 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  @include breakpoint-above("medium") {
    padding: 40px 40px 0;
  }

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

  &__separator {
    border: 1px solid #d6e0ef;
    width: 100%;
    height: 1px;
  }

  &__buttons {
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-end;

    button {
      margin: 15px 0 25px;

      &:first-child {
        margin-right: 16px;
      }
    }
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
        min-width: 24px;
        min-height: 24px;
        padding: 3px;
        background-clip: content-box;
        border: 1px solid #77778b;
        border-radius: 50%;
        margin-right: 8px;
      }
    }

    input[type="radio"] {
      display: none;

      &:checked + label:before {
        background-color: #16d2aa;
        border: 1px solid #16d2aa;
      }
    }

    input[type="text"] {
      margin: 0 0 0 10px;
      width: 250px;
    }
  }
}
</style>
