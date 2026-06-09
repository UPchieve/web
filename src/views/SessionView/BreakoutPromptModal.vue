<template>
  <modal :closeModal="closeModal" :backText="''">
    <div class="breakout-prompt-modal">
      <header>
        <h1 class="breakout-prompt-modal__title">Want help sooner?</h1>
      </header>

      <h2 class="breakout-prompt-modal__subtitle">
        It looks your tutor is busy! If you'd like, we can open this session up
        to other available tutors so you can get help faster.
      </h2>
      <separator />
      <div class="breakout-prompt-modal__footer">
        <div class="breakout-prompt-modal__buttons">
          <large-button
            @click="closeModal"
            class="breakout-prompt-modal__buttons--cancel"
            >Keep Waiting</large-button
          >
          <large-button primary @click="$emit('confirm')"
            >Open to all tutors</large-button
          >
        </div>
      </div>
    </div>
  </modal>
</template>

<script>
import Modal from '@/components/Modal.vue'
import Separator from '@/components/Separator.vue'
import LargeButton from '@/components/LargeButton.vue'

export default {
  name: 'BreakoutPromptModal',
  components: { LargeButton, Modal, Separator },
  emits: ['confirm'],
  props: {
    closeModal: { type: Function, required: true },
  },
}
</script>

<style lang="scss" scoped>
.breakout-prompt-modal {
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

  &__buttons {
    margin-top: 16px;
    @include flex-container(row, flex-end);
    @include child-spacing(left, 16px);

    @include breakpoint-below('tiny') {
      @include flex-container(column, flex-start);
      @include child-spacing(left, 0);
      @include child-spacing(bottom, 20px);
    }

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
