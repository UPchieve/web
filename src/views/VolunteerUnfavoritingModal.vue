<template>
  <modal
    :closeModal="closeModal"
    class="unfavoriting-modal-wrapper"
    :disableModalMobileMode="true"
  >
    <div class="unfavoriting-modal">
    <header>
      <h1 class="unfavoriting-modal-title">
        Do you want to unfavorite <p class="unfavoriting-modal-coach">Coach {{ volunteerName }}?</p>
      </h1>
    </header>   
    <footer>
      <div class="unfavoriting-modal-buttons">
        <large-button @click.native="closeModal" :showArrow="false" class="unfavoriting-modal-cancel-button">Cancel</large-button>
        <large-button :showArrow="false" primary class="unfavoriting-modal-unfavorite-button" @click.native="unfavorite">Unfavorite</large-button>
      </div>
    </footer>
    </div>
  </modal>
</template>

<script>
import Modal from '@/components/Modal'
import LargeButton from '@/components/LargeButton'

export default {
  name: 'volunteer-unfavoriting-modal',
  components: {Modal, LargeButton},
  props: {
    closeModal: { type: Function, required: true },
    volunteerName: { type: String, required: true, default: '' }
  },
  methods: {
    unfavorite() {
      this.$emit('unfavorite', false)
    }
  }
}
</script>

<style lang="scss">
.unfavoriting-modal-wrapper .upc-modal-form {
  @include flex-container(column,center);
  height: 190px;
  border-radius: 16px;
  min-height: 190px;

  &:hover {
    box-shadow: 0px 2px 5px 3px rgba(0, 0, 0, 0.15);
  }

  @include breakpoint-below("medium") {
    padding: 40px 40px 0 40px;
  }

  @include breakpoint-above("tiny") {
    width: 393px;
  }
}
</style>

<style lang="scss" scoped>
.unfavoriting-modal {
  @include flex-container(column);

  &-title {
    @include font-category('heading');
  }

  &-coach {
    font-weight: $font-weight-medium;
  }

  &-buttons {
    margin-top: 0.5em;
    @include flex-container(row, center);
  }

  &-unfavorite-button {
    background-color: $c-information-blue;
    border-radius: 200px;
    padding: 14px 24px;
    color: white;
    border: 1px solid transparent;

    &:hover {
      background-color: #103A90;
    }
  }

  &-cancel-button {
    border-radius: 200px;
    border: 1px solid #8B939F;
    padding: 14px 24px;
    margin-right: 1em;
  }
}
</style>
