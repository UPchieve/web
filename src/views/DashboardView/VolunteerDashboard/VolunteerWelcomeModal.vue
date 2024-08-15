<template>
  <modal
    :closeModal="handleCloseModal"
    class="volunteer-welcome-modal-wrapper"
    backText="Dashboard"
  >
    <img
      class="volunteer-welcome-modal-header-img"
      src="@/assets/updog-certificate-cheer.png"
      alt="image welcoming new volunteers"
    />
    <div class="volunteer-welcome-modal">
      <div class="volunteer-welcome-modal-title-container">
        <h1 class="volunteer-welcome-modal-title">Way to go!</h1>
        <p class="volunteer-welcome-modal-text">
          We're thrilled to have join our volunteer <br />
          community!
        </p>
        <p class="volunteer-welcome-modal-text">
          You've passed the quiz, and you're nearly ready! Continue in your
          dashboard to complete the setup!
        </p>
      </div>

      <button
        @click="handleCloseModal"
        class="volunteer-welcome-modal-btn"
        type="button"
      >
        Got it
      </button>
    </div>
  </modal>
</template>

<script>
import Modal from '@/components/Modal.vue'

export default {
  name: 'volunteer-welcome-modal',
  components: { Modal },
  props: {
    closeModal: { type: Function, required: true },
  },
  methods: {
    handleCloseModal() {
      this.$store.dispatch('user/firstDashboardVisit', false)
      this.closeModal()
    },
  },
}
</script>

<style lang="scss">
// override styling defined in the Modal component to allow for image spread
.volunteer-welcome-modal-wrapper .upc-modal-form {
  padding: 0;
  @include breakpoint-above('medium') {
    width: 550px;
  }
}

.volunteer-welcome-modal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above('medium') {
    @include child-spacing(top, 16px);
  }

  &-title {
    margin-top: 1em;
    margin-bottom: 0.8em;
    @include font-category('display-small');
    @include breakpoint-above('medium') {
      margin-top: 0.4em;
    }
  }

  &-title-container {
    margin: 0 auto;
    width: 80%;
  }

  &-text {
    font-size: 16px;
    color: $c-soft-black;
    margin-bottom: 0;
  }

  &-header-img {
    width: 100%;
  }

  // @todo: make global modal button styles
  &-btn {
    @include flex-container(row, center, center);
    width: 80%;
    background-color: $c-information-blue;
    border-color: transparent;
    color: white;
    margin: 2em auto;
    border: 1px solid rgba(0, 0, 0, 0);
    border-radius: 20px;
    padding: 9px 23px;
    @include font-category('body');
    border: none;

    &:hover {
      background: darken($c-information-blue, 5%);
      color: $c-background-grey;
    }

    @include breakpoint-above('medium') {
      width: 200px;
    }
  }
}
</style>
