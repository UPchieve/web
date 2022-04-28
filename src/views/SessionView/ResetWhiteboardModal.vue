<template>
  <modal :closeModal="closeModal">
    <div class="reset-wb-modal">
      <header>
        <h1 class="reset-wb-modal__title">
          Are you sure you want to reset the whiteboard?
        </h1>
      </header>

      <section class="reset-wb-modal__section">
        <p class="reset-wb-modal__message">
          Doing so will permanently erase everything that’s been added to the
          whiteboard. You will not be able to undo.
        </p>
      </section>
      <separator />
      <footer class="reset-wb-modal__footer">
        <div class="reset-wb-modal__buttons">
          <large-button @click.native="closeModal">Cancel</large-button>
          <large-button
            class="reset-wb-modal__reset-btn"
            @click.native="resetWhiteboard"
            >Reset</large-button
          >
        </div>
      </footer>
    </div>
  </modal>
</template>

<script>
import LargeButton from '@/components/LargeButton'
import Modal from '@/components/Modal'
import Separator from '@/components/Separator'

export default {
  components: { LargeButton, Modal, Separator },
  props: {
    closeModal: { type: Function, required: true },
    setShouldResetWhiteboard: { type: Function, required: true }
  },
  methods: {
    async resetWhiteboard() {
      this.setShouldResetWhiteboard(true)
      this.closeModal()
    },
    cancel() {
      this.closeModal()
    }
  }
}
</script>

<style lang="scss" scoped>
.reset-wb-modal {
  @include flex-container(column);

  &__title {
    @include font-category('display-small');
  }

  &__message {
    @include font-category('body');
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
