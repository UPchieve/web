<template>
  <modal :closeModal="closeModal">
    <div class="deactivate-account-modal">
      <header>
        <h1 class="deactivate-account-modal__title">
          Are you sure you want to deactivate your account?
        </h1>
      </header>

      <section class="deactivate-account-modal__section">
        <p class="deactivate-account-modal__message">
          Deactivating your account means that you will no longer receive any
          emails or texts from UPchieve, including important updates about our
          platform, availability of new subjects, special volunteer
          opportunities, etc. If you temporarily want to stop receiving
          notifications instead, you can de-select your availability on the
          Schedule page.
        </p>
      </section>
      <separator />
      <footer class="deactivate-account-modal__footer">
        <div class="deactivate-account-modal__buttons">
          <large-button @click.native="closeModal">Cancel</large-button>
          <large-button
            class="deactivate-account-modal__reset-btn"
            @click.native="deactivate"
            >Deactivate</large-button
          >
        </div>
      </footer>
    </div>
  </modal>
</template>

<script>
import LargeButton from "@/components/LargeButton";
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";

export default {
  name: "DeactivateAccountModal",
  components: { LargeButton, Modal, Separator },
  props: {
    closeModal: { type: Function, required: true },
    setIsAccountActive: { type: Function, required: true }
  },
  methods: {
    deactivate() {
      this.setIsAccountActive(false);
      this.closeModal();
    }
  }
};
</script>

<style lang="scss" scoped>
.deactivate-account-modal {
  @include flex-container(column);

  &__title {
    @include font-category("display-small");
  }

  &__message {
    @include font-category("body");
    margin: 0 0 35px;
    color: $c-secondary-grey;
    font-size: 15px;
  }

  &__section {
    @include flex-container(column, space-between);
  }

  &__buttons {
    margin-top: 16px;
    @include flex-container(row, flex-end);
    @include child-spacing(left, 16px);
  }

  &__reset-btn {
    background-color: $c-error-red;
    color: white;

    &:hover {
      background: lighten($color: $c-error-red, $amount: 5%);
    }
  }
}
</style>
