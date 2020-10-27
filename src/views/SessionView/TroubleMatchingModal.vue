<template>
  <modal :closeModal="() => false">
    <div class="trouble-matching-modal">
      <header>
        <h1 class="trouble-matching-modal__title">
          We’re having trouble matching you with a coach 😔
        </h1>
      </header>

      <h2 class="trouble-matching-modal__subtitle">
        We recommend ending your session and trying again later.
      </h2>
      <separator />
      <div class="trouble-matching-modal__footer">
        <div class="trouble-matching-modal__buttons">
          <large-button
            @click.native="closeModal"
            class="trouble-matching-modal__buttons--cancel"
            >Keep Waiting</large-button
          >
          <large-button primary @click.native="endSession"
            >End Session</large-button
          >
        </div>
      </div>
    </div>
  </modal>
</template>

<script>
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";
import LargeButton from "@/components/LargeButton";

export default {
  name: "TroubleMatchingModal",
  components: { LargeButton, Modal, Separator },
  props: {
    endSession: { type: Function, required: true },
    closeModal: { type: Function, required: true }
  }
};
</script>

<style lang="scss" scoped>
.trouble-matching-modal {
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

    &--cancel {
      background-color: $c-disabled-grey;
      color: #fff;

      &:hover {
        border: 1px solid transparent;
        background-color: darken($c-disabled-grey, 5%);
      }
    }
  }
}
</style>
