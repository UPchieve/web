<template>
  <modal :closeModal="() => false" :backText="''">
    <div class="unmatched-modal">
      <header>
        <h1 class="unmatched-modal__title">
          Sorry! We couldn’t match your request this time.
        </h1>
      </header>

      <h2 class="unmatched-modal__subtitle">
        Please try again between 12 pm -12 am ET. More coaches will be around to
        help you then 😊
      </h2>

      <separator />

      <footer class="unmatched-modal__footer">
        <div class="unmatched-modal__buttons">
          <large-button primary @click.native="end"
            >Back to dashboard</large-button
          >
        </div>
      </footer>
    </div>
  </modal>
</template>

<script>
import { mapGetters } from "vuex";
import NetworkService from "@/services/NetworkService";
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";
import LargeButton from "@/components/LargeButton";

export default {
  name: "UnmatchedModal",
  components: { LargeButton, Modal, Separator },
  props: {
    sessionId: { type: String, required: true },
    endSession: { type: Function, required: true }
  },
  computed: {
    ...mapGetters({ mobileMode: "app/mobileMode" })
  },
  mounted() {
    // Session toggle buttons are rendered on a higher stacking context
    // than this modal in mobile. Hide the buttons when mounted
    if (this.mobileMode) {
      const sessionToggleButtons = Array.from(
        document.querySelectorAll(".toggleButton")
      );
      for (const element of sessionToggleButtons) {
        element.style.position = "static";
      }
    }
  },
  methods: {
    async end() {
      const data = {
        timeout: 45
      };
      await NetworkService.timedOutSession(this.sessionId, data);
      this.endSession();
    }
  }
};
</script>

<style lang="scss" scoped>
.unmatched-modal {
  @include flex-container(column);

  &__title {
    @include font-category("display-small");
  }

  &__subtitle {
    @include font-category("body");
    margin: 0 0 35px;
    color: $c-secondary-grey;
    font-size: 15px;
  }

  &__buttons {
    margin-top: 16px;
    @include flex-container(row, flex-end);
    @include child-spacing(left, 16px);
  }
}
</style>
