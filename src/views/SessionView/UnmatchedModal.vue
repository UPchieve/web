<template>
  <modal :closeModal="() => false">
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
          <large-button primary @click.native="endSession"
            >Back to dashboard</large-button
          >
        </div>
      </footer>
    </div>
  </modal>
</template>

<script>
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";
import LargeButton from "@/components/LargeButton";

export default {
  name: "UnmatchedModal",
  components: { LargeButton, Modal, Separator },
  props: {
    endSession: { type: Function, required: true }
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
