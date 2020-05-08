<template>
  <div class="report-modal">
    <div class="report-modal__title">Report this session</div>
    <div class="report-modal__info">
      Here's some copy explaining when you should report a session
    </div>
    <textarea
      class="report-modal__message"
      v-model="reportMessage"
      placeholder="Explain what happened..."
    />
    <div class="report-modal__footer">
      <div class="report-modal__seperator" />
      <div class="report-modal__buttons">
        <large-button @click.native="cancel">Cancel</large-button>
        <large-button primary @click.native="submit">Submit</large-button>
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

  &__seperator {
    border: 1px solid $c-border-grey;
    width: 100%;
    height: 1px;
  }

  &__buttons {
    margin-top: 16px;
    @include flex-container(row, flex-end);
    @include child-spacing(left, 16px);
  }
}
</style>
