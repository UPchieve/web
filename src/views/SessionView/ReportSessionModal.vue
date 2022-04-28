<template>
  <div class="report-modal">
    <h1 class="report-modal__title">Report this session</h1>
    <h2 class="report-modal__subtitle">
      Reporting students will result in immediate action from UPchieve. If you
      have a concern that requires less immediate attention, please let us know
      in the feedback form after your session is complete. Not sure what to do?
      <a
        href="https://upc-training-materials.s3.us-east-2.amazonaws.com/reporting-guidelines.pdf"
        target="_blank"
        rel="noopener noreferrer"
      >
        Review guidelines here.
      </a>
    </h2>

    <div class="report-modal__section">
      <div class="report-modal__label">Reason for reporting</div>
      <v-select
        class="report-modal__select report-modal__select--required"
        v-model="reportReason"
        :options="reportReasonOptions"
        :searchable="false"
        :clearable="false"
      ></v-select>
    </div>
    <div class="report-modal__section">
      <div class="report-modal__label">Tell us what happened</div>
      <textarea
        class="report-modal__message"
        v-model="reportMessage"
        placeholder="(Optional) Write a 1-2 sentence summary of what happened"
        rows="3"
      />
    </div>
    <div class="report-modal__footer">
      <div class="report-modal__buttons">
        <large-button @click.native="cancel">Cancel</large-button>
        <large-button primary @click.native="submit" :disabled="!isFormComplete"
          >Report</large-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import NetworkService from '@/services/NetworkService'
import LargeButton from '@/components/LargeButton'

const reportReasonOptions = [
  'This student was extremely rude or inappropriate',
  'I am worried for the immediate safety of this student'
]

export default {
  components: { LargeButton },
  props: {
    modalData: { type: Object, required: true }
  },
  data() {
    return {
      reportReasonOptions,
      reportReason: null,
      reportMessage: ''
    }
  },
  computed: {
    ...mapState({
      currentSession: state => state.user.session
    }),
    isFormComplete() {
      return !!this.reportReason
    }
  },
  methods: {
    async submit() {
      try {
        await NetworkService.reportSession({
          sessionId: this.currentSession._id,
          reportReason: this.reportReason,
          reportMessage: this.reportMessage
        })
      } catch (error) {
        alert('Failed to submit')
      }

      this.$store.dispatch('app/modal/hide')
    },
    cancel() {
      this.$store.dispatch('app/modal/hide')
    }
  }
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

  &__buttons {
    margin-top: 16px;
    @include flex-container(row, flex-end);
    @include child-spacing(left, 16px);
  }
}
</style>
