<template>
  <modal
    :closeModal="handleCloseModal"
    class="volunteer-welcome-modal-wrapper"
    backText="Dashboard"
  >
    <img
      class="volunteer-welcome-modal-header-img"
      src="@/assets/volunteer-welcome-modal-header.png"
    />
    <div class="volunteer-welcome-modal">
      <div class="volunteer-welcome-modal-title-container">
        <h1 class="volunteer-welcome-modal-title">
          Welcome {{ user.firstname }}!
        </h1>
        <p class="volunteer-welcome-modal-subtitle">
          {{ message }}
        </p>
      </div>

      <button @click="handleCloseModal" class="volunteer-welcome-modal-btn">
        Get started <arrow-icon class="volunteer-welcome-modal-arrow-icon" />
      </button>
    </div>
  </modal>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import ArrowIcon from "@/assets/arrow.svg";
import Modal from "@/components/Modal";

export default {
  name: "volunteer-welcome-modal",
  components: { Modal, ArrowIcon },
  props: {
    closeModal: { type: Function, required: true }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode"
    }),
    message() {
      if (this.user.isApproved)
        return "We’re so glad you’re here! Before you can start tutoring, you’ll need to set up your account.";
      else
        return "We’re so glad you’re here! Before you can start tutoring, you’ll need to set up your account and get verified as a volunteer";
    }
  },
  methods: {
    handleCloseModal() {
      this.$store.dispatch("user/firstDashboardVisit", false);
      this.closeModal();
    }
  }
};
</script>

<style lang="scss">
// override styling defined in the Modal component to allow for image spread
.volunteer-welcome-modal-wrapper .upc-modal-form {
  padding: 0;
}

.volunteer-welcome-modal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above("medium") {
    @include child-spacing(top, 16px);
  }

  &-title {
    @include font-category("display-small");
    @include breakpoint-above("medium") {
      margin-top: 24px;
    }
  }

  &-title-container {
    margin: 0 auto;
    width: 80%;
  }

  &-subtitle {
    font-size: 16px;
    color: $c-secondary-grey;
  }

  &-header-img {
    width: 100%;
  }

  &-arrow-icon {
    fill: currentColor;
    height: 16px;
    width: 16px;
    margin-left: 0.5em;
  }

  // @todo: make global modal button styles
  &-btn {
    @include flex-container(row, center, center);
    width: 80%;
    background-color: $c-success-green;
    border-color: transparent;
    color: white;
    margin: 1em auto;
    border: 1px solid rgba(0, 0, 0, 0);
    border-radius: 20px;
    padding: 9px 23px;
    @include font-category("body");
    border: none;

    &:hover {
      background: darken($c-success-green, 5%);
      color: $c-background-grey;
    }

    @include breakpoint-above("medium") {
      width: 200px;
    }
  }
}
</style>
