<template>
  <div class="feedback-form">
    <div class="header">
      <h2>{{ headerText }}</h2>
    </div>
    <table class="questions-table">
      <tr class="title-row">
        <td class="title-cell">
          <div v-if="leadParagraphs && leadParagraphs.length" style="padding-top: 40px; padding-bottom: 30px">
            <p
              v-for="(paragraph, paragraph_index) in leadParagraphs"
              :style="paragraph.style"
              v-bind:key="paragraph_index"
            >{{ paragraph.text }}</p>
          </div>
        </td>
      </tr>
      <tr
        class="question-row"
        v-for="(question, question_index) in questions"
        v-bind:key="question_index"
      >
        <td class="question-cell">
          <div class="question-title">{{ question.title }}</div>
          <div v-if="question.qtype === 'star-rating'">
            <table class="star-rating-table">
              <tr
                class="star-rating-row forMobileView"
                v-for="(subquestion, subquestion_index) in question.options"
                v-bind:key="subquestion"
              >
                <td class="star-rating-cell">
                  <vue-star-rating
                    v-model="
                      userResponse[question.alias][
                        question.options_alias[subquestion_index]
                      ]
                    "
                    inactive-color="#ffffff"
                    active-color="#36d2aa"
                    border-color="#36d2aa"
                    :border-width="4"
                    :star-size="30"
                    :padding="1"
                    :show-rating="false"
                  >
                  </vue-star-rating>
                </td>
              </tr>
            </table>
          </div>
          <div v-if="question.qtype === 'multiple-radio'">
            <table class="radio-question-table">
              <tr class="radio-question-row">
                <td class="mobileRemove"></td>
                <td
                  class="radio-question-selection-title"
                  v-for="(label, label_index) in question.table_title"
                  v-bind:key="label_index"
                >
                  {{ label }}
                </td>
              </tr>
              <tr
                class="radio-question-row forMobileView"
                v-for="(subquestion, subquestion_index) in question.options"
                v-bind:key="subquestion"
              >
                <td class="radio-question-cell">{{ subquestion }}</td>
                <td
                  class="radio-question-selection-cell"
                  v-for="index in question.table_title.length"
                  v-bind:key="index"
                >
                  <input
                    v-model="
                      userResponse[question.alias][
                        question.options_alias[subquestion_index]
                      ]
                    "
                    type="radio"
                    :name="
                      `multiple-radio-${
                        question.qid
                      }_${subquestion_index.toString()}`
                    "
                    :value="index"
                  />
                </td>
              </tr>
            </table>
          </div>
          <div v-else-if="question.qtype === 'radio-list'">
            <div class="radio-list">
              <div
                class="radio-list__option"
                v-for="(subquestion, subquestion_index) in question.options"
                v-bind:key="subquestion"
              >
                <input
                  :id="
                    `radio-list-option_${
                      question.options_alias[subquestion_index]
                    }`
                  "
                  class="radio-list__option-input"
                  v-model="userResponse[question.alias]"
                  type="radio"
                  :name="`radio-list-${question.qid}`"
                  :value="question.options_alias[subquestion_index]"
                />
                <label
                  class="radio-list__option-label"
                  :for="
                    `radio-list-option_${
                      question.options_alias[subquestion_index]
                    }`
                  "
                >
                  {{ subquestion }}
                </label>
              </div>
            </div>
          </div>
          <div v-else-if="question.qtype === 'text'">
            <div
              class="question-secondary-title"
              v-if="question.secondary_title.length != 0"
            >
              {{ question.secondary_title }}
            </div>
            <textarea
              class="text-question-textarea"
              v-model="userResponse[question.alias]"
            />
          </div>
          <div v-else>
            <!-- something else -->
          </div>
        </td>
      </tr>
      <tr class="submit-button-row">
        <td class="submit-button-cell">
          <button class="submit-button" v-on:click="submitFeedback">
            SUBMIT
          </button>
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { mapState } from "vuex";

import AnalyticsService from "@/services/AnalyticsService";
import NetworkService from "@/services/NetworkService";

export default {
  props: [
    "headerText",
    "leadParagraphs",
    "questions",
    "metadata"
  ],
  data() {
    return {
      userResponse: {}
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    })
  },
  beforeMount() {
    var _self = this;
    this.questions.map(function(question) {
      if (
        question.qtype === "multiple-radio" ||
        question.qtype === "star-rating"
      )
        _self.userResponse[question.alias] = {};
    });
  },
  methods: {
    submitFeedback() {
      // analytics: tracking feedback response data
      AnalyticsService.trackFeedback(this, this.user.isFakeUser);
      
      // submit data
      NetworkService.feedback(this, Object.assign(
          {
            feedbackFor: this.feedbackFor,
            responseData: this.userResponse
          }, 
          this.metadata
        )
      );
      
      // emit form submit event to parent
      this.$emit("form-submit", this.userResponse);
    }
  }
}
</script>

<style lang="scss" scoped>
.header {
  height: 100px;
  margin: 0;
  padding-left: 30px;
  margin-bottom: 40px;
  display: flex;
  padding: 30px 0 30px 50px;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  background-color: white;
}

.feedback-form {
  background-color: #e5f2fc;
  min-height: 100%;
  width: 100%;
  position: relative;
  vertical-align: middle;
  text-align: center;
}

.questions-table {
  width: 75%;
  max-width: 750px;
  margin: auto;
  background-color: white;
  vertical-align: middle;
  display: table;
  border-radius: 5px;
  -webkit-border-radius: 5px;
  -moz-border-radius: 5px;
  box-shadow: -9px 9px #2757ca;
}

.title-row {
  display: table-row;
}

.title-cell {
  display: table-cell;
  padding: 20px 0;
  vertical-align: middle;
  font-size: 19px;
  text-align: left;
  padding-left: 60px;
  padding-right: 60px;
}

.question-row {
  display: table-row;
}

.question-cell {
  display: table-cell;
  vertical-align: middle;
  font-size: 19px;
  text-align: left;
  padding-left: 60px;
  padding-right: 60px;
  padding-bottom: 40px;
}

.question-title {
  padding-bottom: 10px;
}

.question-secondary-title {
  font-size: 15px;
  padding-bottom: 10px;
}

.star-rating-table {
  width: 100%;
  font-size: 15px;
}

.star-rating-row {
  display: table-row;
}

.star-rating-cell {
  width: 50%;
  display: table-cell;
  vertical-align: middle;
  padding-top: 20px;
  padding-bottom: 25px;
}

.radio-question-table {
  width: 100%;
  font-size: 15px;
}

.radio-question-table tr:nth-child(even) {
  background: #f1f8fc;
}

.radio-question-table tr:nth-child(odd) {
  background: #e5f2fc;
}

.radio-question-table tr:nth-child(1) {
  background: white;
}

.radio-question-row {
  display: table-row;
}

.radio-question-cell {
  display: table-cell;
  vertical-align: middle;
  width: 175px;
  padding-left: 15px;
  padding-top: 20px;
  padding-bottom: 25px;
}

.radio-question-selection-title {
  display: table-cell;
  padding-left: 2px;
  padding-right: 2px;
  text-align: center;
  vertical-align: middle;
  padding-top: 8px;
  padding-bottom: 15px;
}

.radio-question-selection-cell {
  display: table-cell;
  padding-left: 2px;
  padding-right: 2px;
  text-align: center;
  vertical-align: middle;
}

.radio-list {
  padding: 15px 5px 20px 15px;
  background: #f1f8fc;
  font-size: 15px;

  display: flex;
  flex-wrap: wrap;

  &__option {
    flex-grow: 1;
    flex-basis: 50%;
    min-width: 270px;

    margin: 7px 0;
    display: flex;
    align-items: center;
  }

  &__option-input {
    margin: 0;
  }

  &__option-label {
    margin: 2px 0 0 10px;
    font-weight: normal;
  }
}

.text-question-textarea {
  width: 100%;
  resize: none;
  font-size: 15px;
  height: 80px;
  border-width: 3px;
  -webkit-border-radius: 3px;
  -moz-border-radius: 3px;
  border-radius: 3px;
  border-color: #16d2aa;
}

.submit-button-row {
  display: table-row;
}

.submit-button-cell {
  display: table-cell;
  text-align: right;
  padding-right: 60px;
  padding-bottom: 80px;
}

.submit-button {
  width: 180px;
  height: 50px;
  background-color: #f6f6f6;
  color: #16d2aa;
  border: none;
  font-weight: 600;
  border-radius: 50px;
  -webkit-border-radius: 50px;
  -moz-border-radius: 50px;
  font-size: 15px;
  float: right;
}

.submit-button:hover,
.submit-button:active {
  background-color: #16d2aa;
  color: #fff;
}

@media screen and (max-width: 700px) {
  .mobileRemove {
    display: none !important;
  }

  .header {
    padding: 1em 1em 1em 2em !important;
  }

  table,
  thead,
  tbody,
  th,
  tr {
    display: block !important;
  }

  .title-cell {
    padding: 1.5em 1em 1em !important;
  }

  .questions-table {
    width: 95vw !important;
  }

  .question-cell {
    padding: 0em 1em 2em !important;
  }

  .star-rating-row {
    padding-bottom: 1em !important;
  }

  .star-rating-cell {
    width: calc(100vw - 56.75px);
    display: table-caption;
    padding: 0.5em 0;
  }

  .radio-question-cell {
    width: calc(100vw - 56.75px);
    display: table-caption !important;
    padding: 1.5em !important;
  }

  .radio-question-selection-title {
    width: calc((100vw - 56.75px) / 5);
    display: inline-block;
    font-size: 12px;

    &--rotate {
      transform: rotate(-40deg);
    }
  }

  .radio-question-selection-cell {
    padding-bottom: 1em !important;
  }

  .submit-button-cell {
    padding-left: 1.2em !important;
  }
}
</style>