<template>
  <div class="report-modal">
    <h1 class="report-modal__title">Report this session</h1>
    <h2 class="report-modal__subtitle">
      {{ reportModalSubtitle }}
      <a :href="guidelineLink" target="_blank" rel="noopener noreferrer">
        Review guidelines here.
      </a>
    </h2>

    <div class="report-modal__section">
      <div class="report-modal__label">Reason for reporting</div>
      <FormSelect
        v-model="reportReason"
        :options="reportReasonOptionsToDisplay"
      />
    </div>
    <div class="report-modal__section">
      <div class="report-modal__label">Tell us what happened</div>
      <textarea
        autocomplete="off"
        class="report-modal__message"
        v-model="reportMessage"
        placeholder="(Optional) Write a 1-2 sentence summary of what happened"
        rows="3"
      />
    </div>
    <div class="report-modal__footer">
      <div v-if="error" class="report-modal__error">{{ error }}</div>
      <div class="report-modal__buttons">
        <large-button @click="cancel">Cancel</large-button>
        <large-button
          primary
          @click="submit"
          :disabled="!isFormComplete ? true : null"
          >Report</large-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import LargeButton from '@/components/LargeButton.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import { mapState, mapGetters } from 'vuex'
import { EVENTS } from '@/consts'

// TODO: Options should be hydrated via the database
const volunteerReportReasonOptions = [
  '[Immediate ban] Student extremely rude/inappropriate',
  'I am worried for the immediate safety of this student',
]

const studentReportReasonOptions = [
  'Coach asked me to connect off of UPchieve',
  'Coach made me feel uncomfortable or unsafe',
  'Coach used inappropriate language',
  'Coach talked about inappropriate and offensive topics',
]

const studentGuidelineLink =
  'https://help.upchieve.org/en/articles/24-coach-community-guidelines'
const volunteerGuidelineLink =
  'https://upc-training-materials.s3.us-east-2.amazonaws.com/reporting-guidelines.pdf'
const studentSubtitleText =
  'Only report a tutor for serious safety or community guideline violations. For other concerns (tutor was unhelpful, ran out of time, technical issues), please use the feedback form after the session.'
const volunteerSubtitleText =
  'Reporting students will result in immediate action from UPchieve. If you have a concern that requires less immediate attention, please let us know in the feedback form after your session is complete. Not sure what to do?'

export default {
  components: { LargeButton, FormSelect },
  props: {
    /*
     * @TODO: Move to Composition API and use Typescript
     *  modalData: {
     *   currentSession: the session object
     *   source: 'session' | 'recap' (where the report modal is opened from)
     *   toggleReportSubmitted: function, optional
     * }
     */
    modalData: { type: Object, required: true },
  },
  data() {
    return {
      reportReasonOptions: volunteerReportReasonOptions,
      reportReason: null,
      reportMessage: '',
      error: '',
    }
  },
  mounted() {
    if (this.isInRecap)
      AnalyticsService.captureEvent(
        EVENTS.SESSION_RECAP_DM_REPORT_MODAL_SHOWN,
        {
          sessionId: this.currentSession.id,
        }
      )
  },
  computed: {
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
    }),
    ...mapState({
      user: (state) => state.user.user,
    }),
    isFormComplete() {
      return !!this.reportReason
    },
    currentSession() {
      return this.modalData.currentSession
    },
    isInRecap() {
      return this.modalData.source === 'recap'
    },
    reportReasonOptionsToDisplay() {
      return this.isVolunteer
        ? volunteerReportReasonOptions
        : studentReportReasonOptions
    },
    guidelineLink() {
      return this.isStudent ? studentGuidelineLink : volunteerGuidelineLink
    },
    reportModalSubtitle() {
      return this.isStudent ? studentSubtitleText : volunteerSubtitleText
    },
  },
  methods: {
    async submit() {
      this.error = ''
      try {
        await NetworkService.reportSession({
          sessionId: this.currentSession.id,
          reportReason: this.reportReason,
          reportMessage: this.reportMessage,
          source: this.modalData.source,
        })
        if (this.modalData.toggleReportSubmitted)
          this.modalData.toggleReportSubmitted()
      } catch {
        this.error = 'Failed to submit report. Please try again.'
        return
      }

      if (this.isInRecap)
        AnalyticsService.captureEvent(
          EVENTS.SESSION_RECAP_DM_REPORT_MODAL_SUBMITTED,
          {
            sessionId: this.currentSession.id,
          }
        )

      this.$store.dispatch('app/modal/hide')
    },
    cancel() {
      this.$store.dispatch('app/modal/hide')
    },
  },
}
</script>

<style lang="scss" scoped>
.report-modal {
  @include flex-container(column);

  &__title {
    @include font-category('display-small');
  }

  &__subtitle {
    @include font-category('body');
    margin: 0 0 35px;
    color: $c-secondary-grey;
    font-size: 15px;
  }

  &__section {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;

    &:not(:last-of-type) {
      margin-bottom: 20px;
    }
  }

  &__label {
    align-self: flex-start;
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 5px;
  }

  &__message {
    padding: 10px;
    border: solid 1px $c-border-grey;
    border-radius: 5px;
    resize: none;

    &:focus {
      outline: none;
    }
  }

  &__error {
    color: $c-error-red;
    font-size: 14px;
    margin-bottom: 8px;
  }

  &__buttons {
    margin-top: 16px;
    @include flex-container(row, flex-end);
    @include child-spacing(left, 16px);
  }
}
</style>
