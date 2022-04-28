<template>
  <modal 
    :closeModal="closeModal" 
    class="list-full-modal-wrapper"
    :disableModalMobileMode="true"
  >
    <div class="list-full-modal">
      <header>
        <h1 class="list-full-modal-title">
          Your Favorite Coach list is full
        </h1>
      </header>

      <h2 class="list-full-modal-subtitle">
        You must unfavorite a coach from your "Favorite Coach" list in order to favorite a new coach.
      </h2>

      <footer>
        <div class="list-full-modal-buttons">
          <large-button @click.native="closeModal" class="list-full-modal-okay-button" :showArrow="false">Okay</large-button>
          <large-button primary class="list-full-modal-redirect-button" :showArrow="false" :routeTo="null"
            >Go to my list</large-button
          >
        </div>
      </footer>
    </div>
  </modal>
</template>

<script>
import Modal from '@/components/Modal'
import LargeButton from '@/components/LargeButton'

// TODO: replace routeTo with the coach route
export default {
  name: 'favorited-list-full-modal',
  components: { Modal, LargeButton },
  props: {
    closeModal: { type: Function, required: true },
  },
}
</script>

<style lang="scss">
.list-full-modal-wrapper .upc-modal-form {
  @include flex-container(column,center);
  height: 261px;
  border-radius: 16px;
  padding-top: 36px;

  &:hover {
    box-shadow: 0px 2px 5px 3px rgba(0, 0, 0, 0.15);
  }

  @include breakpoint-below("medium") {
    padding: 40px 40px 0 40px;
  }

  @include breakpoint-above("small") {
    width: 463px;
  }

}
</style>

<style lang="scss" scoped>
.list-full-modal {
  @include flex-container(column);
  &-title {
    @include font-category('display-small');  
  }

  &-subtitle {
    @include font-category('heading');
    margin-top: 0.8em;
  }

  &-buttons {
    @include flex-container(row, center);
    margin-top: 1.6em;
  }

  &-okay-button {
    border-radius: 200px;
    border: 1px solid #8B939F;
    padding: 14px 24px;
    margin-right: 1em;
  }

  &-redirect-button {
    background-color: $c-information-blue;
    color: white; 
    border-radius: 200px;
    padding: 14px 24px;
    border: 1px solid transparent;
    &:hover {
      background-color: #103A90;
    }
  }
}
</style>

