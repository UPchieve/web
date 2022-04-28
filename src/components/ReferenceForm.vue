<template>
  <div>
    <h3 v-if="didSubmit" class="helper-message">Reference submitted!</h3>
    <h3 v-else-if="isNoLongerReference" class="helper-message">
      Sorry, you've been removed as a reference.
    </h3>
    <div
      v-else
      class="questions-container"
      :class="isAdminReview && 'admin-review'"
    >
      <fieldset :disabled="isAdminReview">
        <legend class="heading-legend" v-if="!isAdminReview">
          <h1 class="title">UPchieve Applicant Reference Evaluation</h1>
        </legend>
        <legend v-else>Evaluation Responses</legend>
        <p v-if="!isAdminReview">
          Please answer the following questions honestly based on your knowledge
          of/experience with the applicant. It should take less than 10 minutes
          to complete and all answers will remain confidential.
        </p>
        <div class="question-col">
          <label for="affiliation" class="uc-form-label"
            >In what capacity do you know the applicant?</label
          >
          <input
            type="text"
            id="affiliation"
            class="uc-form-input"
            v-model="affiliation"
            required
            placeholder="Your answer"
          />
        </div>

        <div class="question-col">
          <label for="relationship-length" class="uc-form-label"
            >How long have you known the applicant?</label
          >
          <input
            type="text"
            id="relationship-length"
            class="uc-form-input"
            v-model="relationshipLength"
            required
            placeholder="Your answer"
          />
        </div>
        <template v-if="!isAdminReview">
          <div
            class="question-row"
            v-for="(question, question_index) in multipleRadioQuestions"
            v-bind:key="question_index"
          >
            <div class="uc-form-label">{{ question.title }}</div>
            <div class="position-wrapper">
              <div class="question-scroll-container">
                <table>
                  <tr class="radio-question-row">
                    <td class="mobile-remove"></td>
                    <td
                      class="radio-question-selection-title"
                      v-for="(label, labelIndex) in question.tableTitle"
                      v-bind:key="labelIndex"
                    >
                      {{ label }}
                    </td>
                  </tr>
                  <tr
                    class="radio-question-row"
                    v-for="(subquestion, subquestionIndex) in question.options"
                    v-bind:key="subquestion"
                  >
                    <td class="radio-question-cell">{{ subquestion }}</td>
                    <td
                      class="radio-question-selection-cell"
                      v-for="index in question.tableTitle.length"
                      v-bind:key="index"
                    >
                      <input
                        class="uc-form-input"
                        v-model="
                          multipleRadioResponse[
                            question.optionsAlias[subquestionIndex]
                          ]
                        "
                        type="radio"
                        :name="
                          `multiple-radio-${
                            question.qid
                          }_${subquestionIndex.toString()}`
                        "
                        :value="index"
                      />
                    </td>
                  </tr>
                </table>

                <table
                  class="mobile-pinned-questions-container"
                  v-if="mobileMode"
                >
                  <tr class="radio-question-row">
                    <td class="mobile-remove mobile-remove--shadow"></td>
                    <td
                      class="radio-question-selection-title radio-question-selection-title--hidden"
                      v-for="(label, labelIndex) in question.tableTitle"
                      v-bind:key="labelIndex"
                    >
                      {{ label }}
                    </td>
                  </tr>
                  <tr
                    class="radio-question-row"
                    v-for="subquestion in question.options"
                    v-bind:key="subquestion"
                  >
                    <td class="radio-question-cell radio-question-cell--shadow">
                      {{ subquestion }}
                    </td>
                    <td
                      class="radio-question-selection-cell--hidden"
                      v-for="index in question.tableTitle.length"
                      v-bind:key="index"
                    >
                      <input class="uc-form-input" type="radio" />
                    </td>
                  </tr>
                </table>
              </div>
            </div>
          </div>
        </template>

        <div v-else>
          <div
            class="question-col"
            v-for="(question, question_index) in multipleRadioQuestions"
            v-bind:key="question_index"
          >
            <div class="uc-form-label">{{ question.title }}</div>
            <div class="radio-answers">
              <div
                v-for="(subquestion, subquestionIndex) in question.options"
                v-bind:key="subquestion"
              >
                <p class="radio-answer-row">
                  <span class="radio-answer-title">{{ subquestion }}</span>
                  -
                  {{ referenceResponseText(question, subquestionIndex) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="question-col">
          <label for="rejection-reason" class="uc-form-label">
            Do you know of any reason why the applicant would not be appropriate
            to work with a child on a one-on-one basis?
          </label>
          <textarea
            type="text"
            id="rejection-reason"
            class="uc-form-input"
            v-model="rejectionReason"
            placeholder="Your answer"
          />
        </div>

        <div class="question-col">
          <label for="additionalInfo" class="uc-form-label">
            Is there anything else that you think we should know about the
            applicant?
          </label>
          <textarea
            type="text"
            id="additionalInfo"
            class="uc-form-input"
            v-model="additionalInfo"
            placeholder="Your answer"
          />
        </div>
      </fieldset>

      <p class="error" v-if="error">{{ error }}</p>

      <div class="submit-button-row" v-if="!isAdminReview">
        <button
          class="submit-button"
          type="button"
          v-on:click="submitForm"
          :disabled="!isValidForm()"
        >
          SUBMIT
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { mapState, mapGetters } from 'vuex'

export default {
  name: 'ReferenceForm',
  props: {
    isAdminReview: { type: Boolean, default: false },
    reference: { type: Object }
  },
  data() {
    return {
      error: '',
      didSubmit: false,
      isNoLongerReference: false,
      affiliation: '',
      relationshipLength: '',
      rejectionReason: '',
      additionalInfo: '',
      multipleRadioQuestions: [
        {
          qid: '1',
          qtype: 'multiple-radio',
          title: 'The applicant is...',
          secondary_title: '',
          tableTitle: [
            'Strongly Disagree',
            'Somewhat Disagree',
            'Neither Agree or Disagree',
            'Somewhat Agree',
            'Strongly Agree',
            "I cannot speak to this aspect of the applicant's character"
          ],
          options: [
            'patient',
            'a positive role model',
            'agreeable and approachable',
            'able to communicate effectively'
          ],
          optionsAlias: [
            'patient',
            'positiveRoleModel',
            'agreeableAndApproachable',
            'communicatesEffectively'
          ]
        },
        {
          qid: '2',
          qtype: 'multiple-radio',
          title: '',
          secondary_title: '',
          tableTitle: [
            'Strongly Disagree',
            'Somewhat Disagree',
            'Neither',
            'Somewhat Agree',
            'Strongly Agree'
          ],
          options: [
            'I would trust the applicant to spend time with a child alone.'
          ],
          optionsAlias: ['trustworthyWithChildren']
        }
      ],
      multipleRadioResponse: {
        patient: '',
        positiveRoleModel: '',
        agreeableAndApproachable: '',
        communicatesEffectively: '',
        trustworthyWithChildren: ''
      }
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode'
    })
  },
  async mounted() {
    if (this.isAdminReview) {
      this.affiliation = this.reference.affiliation
      this.relationshipLength = this.reference.relationshipLength
      this.rejectionReason = this.reference.rejectionReason
      this.additionalInfo = this.reference.additionalInfo
      this.multipleRadioResponse.patient = this.reference.patient
      this.multipleRadioResponse.positiveRoleModel = this.reference.positiveRoleModel
      this.multipleRadioResponse.agreeableAndApproachable = this.reference.agreeableAndApproachable
      this.multipleRadioResponse.communicatesEffectively = this.reference.communicatesEffectively
      this.multipleRadioResponse.trustworthyWithChildren = this.reference.trustworthyWithChildren
    } else {
      try {
        await NetworkService.checkReference(this.$route.params.referenceId)
      } catch (error) {
        this.isNoLongerReference = true
      }
    }
  },

  methods: {
    submitForm() {
      if (!this.isValidForm()) {
        this.error = 'Please answer all of the questions.'
        return
      }

      const {
        patient,
        positiveRoleModel,
        agreeableAndApproachable,
        communicatesEffectively,
        trustworthyWithChildren
      } = this.multipleRadioResponse

      const data = {
        affiliation: this.affiliation,
        relationshipLength: this.relationshipLength,
        rejectionReason: this.rejectionReason,
        additionalInfo: this.additionalInfo,
        patient,
        positiveRoleModel,
        agreeableAndApproachable,
        communicatesEffectively,
        trustworthyWithChildren
      }
      const referenceId = this.$route.params.referenceId

      NetworkService.saveReferenceForm(referenceId, data)
        .then(() => {
          this.didSubmit = true
          AnalyticsService.captureEvent(EVENTS.REFERENCE_FORM_SUBMITTED, {
            event: EVENTS.REFERENCE_FORM_SUBMITTED,
            userId: this.user._id,
            referenceId: referenceId
          })
        })
        .catch(() => {
          this.error = 'Error submitting form, please try again.'
        })
    },
    isValidForm() {
      const {
        patient,
        positiveRoleModel,
        agreeableAndApproachable,
        communicatesEffectively,
        trustworthyWithChildren
      } = this.multipleRadioResponse

      const requiredInputs = {
        affiliation: this.affiliation,
        relationshipLength: this.relationshipLength,
        rejectionReason: this.rejectionReason,
        additionalInfo: this.additionalInfo,
        patient,
        positiveRoleModel,
        agreeableAndApproachable,
        communicatesEffectively,
        trustworthyWithChildren
      }

      const requiredInputValues = Object.values(requiredInputs)
      const isValidForm = requiredInputValues.every(input => !!input)

      return isValidForm
    },
    referenceResponseText(question, index) {
      const optionAlias = question.optionsAlias[index]
      const referenceResponse = this.multipleRadioResponse[optionAlias]
      // Ratings recorded from a reference are 1-based indexed, subtract 1 to make 0-based indexed
      const responseRating = question.tableTitle[referenceResponse - 1]
      return responseRating
    }
  }
}
</script>

<style lang="scss" scoped>
.helper-message {
  text-align: center;
  padding: 50px 0 100px;
}
textarea.uc-form-input {
  resize: none;
  height: 80px;
  border: 2px solid #1855d1;
  margin-top: 10px;

  &:focus {
    border-bottom: 2px solid #1855d1;
  }
}

.uc-form {
  &-label {
    font-weight: 500;
  }

  &-input {
    border-bottom: 3px solid $c-information-blue;
    &:focus {
      outline: none;
      border-bottom: 3px solid darken($c-information-blue, 15%);
    }
  }
}

.question-col {
  @include flex-container(column, flex-start);
  width: 60%;
  margin: 3em 0;
}

.reference-form-container {
  background-color: #e5f2fc;
  text-align: left;
  padding: 2em 0;
  min-height: 100%;
}

.reference-form {
  max-width: 100vw;
  margin: 0 auto;
  background-color: white;
  border-radius: 5px;

  @include breakpoint-above('medium') {
    max-width: 900px;
    box-shadow: -9px 9px $c-information-blue;
  }
}

.question-row {
  overflow: hidden;
  width: 95vw;
  padding-right: 2em;
  display: inline-block;
  margin-bottom: 4em;

  @include breakpoint-above('medium') {
    width: 100%;
  }
}

.question-scroll-container {
  overflow-x: auto;
}

.position-wrapper {
  position: relative;
}

.mobile-pinned-questions-container {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  pointer-events: none;
}

.questions-container {
  padding: 1em;
  width: 100%;
  width: 100vw;

  @include breakpoint-above('medium') {
    width: 100%;
    padding: 4em;
  }
}

.radio-question-row:nth-child(even) {
  background: #f1f8fc;
}

.radio-question-row:nth-child(odd) {
  background: #e5f2fc;
}

.radio-question-row:nth-child(1) {
  background: white;
}

.radio-question-cell {
  width: 175px;
  padding: 1.4em 1.2em 1.6em 1em;

  &--shadow {
    box-shadow: 5px 0 5px -1px #e0e0e0;
  }
}

.radio-question-selection-title {
  display: table-cell;
  padding-left: 22px;
  padding-right: 22px;
  text-align: center;
  vertical-align: middle;
  padding-top: 8px;
  padding-bottom: 15px;

  &--hidden {
    visibility: hidden;
  }
}

.radio-question-selection-cell {
  text-align: center;
  vertical-align: middle;

  &--hidden {
    display: none;
  }
}

.submit-button-row {
  @include flex-container(row, flex-end);
}

.submit-button {
  width: 180px;
  height: 50px;
  background-color: $c-bg;
  color: $c-success-green;
  border: none;
  font-weight: 600;
  border-radius: 50px;
  font-size: 15px;
  float: right;
  margin-bottom: 1em;

  &:hover,
  &:active {
    background-color: $c-success-green;
    color: #fff;
  }

  &:disabled {
    background-color: $c-bg;
    color: $c-secondary-grey;
  }
}

.mobile-remove {
  &--shadow {
    box-shadow: 5px 0 5px -1px #ffffff;

    @include breakpoint-above(medium) {
      box-shadow: none;
    }
  }
}

.error {
  color: $c-error-red;
  margin: 2em 0;
}

.admin-review {
  padding-top: 1em;

  & .uc-form-input {
    border: none;
  }

  & textarea {
    max-height: 200px;
  }
}

.radio-answer-title {
  width: 120px;
  display: inline-block;
  margin-right: 1.4em;
}

.radio-answers {
  background-color: rgba(239, 239, 239, 0.3);
  padding: 6px 12px;
  text-align: left;
}

.radio-answer-row {
  @include flex-container(row, flex-start, center);
}

.heading-legend {
  border-bottom: 0;
  margin-bottom: 0;
}
</style>
