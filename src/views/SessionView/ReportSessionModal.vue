<template>
  <div class="report-modal">
    <h1 class="report-modal__title">Report this session</h1>
    <h2 class="report-modal__subtitle">
      We encourage volunteers to report sessions in which students have either
      misused the platform (e.g., by not seeking or actively participating in
      tutoring) or not treated you with respect (e.g., by getting impatient or
      swearing). We will review the entire chat log and, if needed, issue the
      student a warning or take disciplinary action.
    </h2>
    <textarea
      class="report-modal__message"
      v-model="reportMessage"
      placeholder="(Optional) Write a 1-2 sentence summary of why you're reporting the student"
      rows="3"
    />
    <div class="report-modal__footer">
      <div class="report-modal__buttons">
        <large-button @click.native="cancel">Cancel</large-button>
        <large-button primary @click.native="submit">Report</large-button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import NetworkService from "@/services/NetworkService";
import LargeButton from "@/components/LargeButton";

export default {
  components: { LargeButton },
  props: {
    modalData: { type: Object, required: true }
  },
  data() {
    return {
      reportMessage: ""
    };
  },
  computed: {
    ...mapState({
      currentSession: state => state.user.session
    })
  },
  methods: {
    async submit() {
      try {
        await NetworkService.reportSession({
          sessionId: this.currentSession._id,
          reportMessage: this.reportMessage
        });
      } catch (error) {
        alert("Failed to submit");
      }

      this.$store.dispatch("app/modal/hide");
    },
    cancel() {
      this.$store.dispatch("app/modal/hide");
    }
  }
};
</script>

<style lang="scss" scoped>
.report-modal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above("medium") {
    @include child-spacing(top, 16px);
  }

  &__title {
    @include font-category("display-small");
  }

  &__subtitle {
    @include font-category("body");
    color: $c-secondary-grey;
    font-size: 15px;
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
