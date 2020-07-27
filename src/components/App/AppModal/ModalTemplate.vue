<template>
  <div
    class="ModalTemplate"
    :class="{ 'ModalTemplate--important': important }"
    @click="closeModal"
  >
    <div v-if="mobileMode" class="ModalTemplate-header">
      <div class="ModalTemplate-header-close-button" @click="handleCancel">
        <arrow-icon class="icon" />
        <p>{{ backText }}</p>
      </div>
    </div>

    <div class="ModalTemplate-form">
      <slot />

      <template v-if="!mobileMode && showTemplateButtons">
        <div class="ModalTemplate-seperator" />
        <div class="ModalTemplate-buttons">
          <large-button v-if="!alertModal" @click.native="handleCancel"
            >Cancel</large-button
          >
          <large-button
            primary
            @click.native="$emit('accept')"
            :disabled="!enableAccept"
            v-if="showAccept"
            >{{ acceptText }}</large-button
          >
        </div>
      </template>

      <div class="ModalTemplate-form--bottom-padding" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import LargeButton from "@/components/LargeButton";
import ArrowIcon from "@/assets/arrow.svg";

export default {
  components: { LargeButton, ArrowIcon },
  props: {
    acceptText: { type: String, default: "Accept" },
    backText: { type: String, default: "Back" },
    enableAccept: Boolean,
    alertModal: Boolean,
    important: Boolean,
    showTemplateButtons: { type: Boolean, default: true },
    showAccept: { type: Boolean, default: true }
  },
  mounted() {
    const body = document.querySelector("body");
    body.classList.add("disable-scroll");
  },
  beforeDestroy() {
    const body = document.querySelector("body");
    body.classList.remove("disable-scroll");
  },
  computed: {
    ...mapGetters({ mobileMode: "app/mobileMode" })
  },
  methods: {
    handleCancel() {
      this.$emit("cancel");
      this.$store.dispatch("app/modal/hide");
    },
    closeModal(event) {
      const { target } = event;
      if (target.classList.contains("ModalTemplate")) this.handleCancel();
    }
  }
};
</script>

<style lang="scss" scoped>
$header-height: 80px;

.ModalTemplate {
  animation: slideUp 0.4s forwards;
  background: $c-information-blue;

  min-width: 100%;
  height: 100%;

  position: fixed;
  top: 0;
  left: 0;
  z-index: get-z("modal");

  &--important {
    background: $c-warning-orange;
  }

  @include breakpoint-above("medium") {
    animation: none;
    background: rgba(0, 0, 0, 0.4);
    padding: (get-app-header-height("medium") + 20px) 40px;
    display: flex;
    align-items: center;
  }
}

.ModalTemplate-header {
  @include flex-container(row);
  min-height: $header-height;
  padding: 22px;

  &-close-button {
    @include flex-container(row, initial, baseline);
    @include child-spacing(left, 8px);
    @include font-category("helper-text");
    color: white;
    cursor: pointer;
    align-items: center;

    .icon {
      fill: white;
      height: 16px;
      transform: rotateY(180deg);
    }
    & p {
      line-height: 1em;
      margin: 0;
    }
  }
}

.ModalTemplate-form {
  animation: slideUp 0.6s forwards;
  background: white;
  border-radius: 40px 40px 0 0;

  width: 100%;
  height: calc(100% - #{$header-height});
  overflow: auto;

  padding: 40px 20px 0 20px;

  // Hack. Bottom padding does not get properly applied when the <slot> content
  // causes overflow. We get around it by applying this class to a final empty
  // <div>.
  &--bottom-padding {
    padding-top: 20px;
  }

  @include breakpoint-above("medium") {
    @include flex-container(column);
    @include child-spacing(top, 16px);

    animation: none;
    border-radius: 8px;
    box-shadow: 0px 0px 40px rgba(0, 0, 0, 0.04);

    max-width: 600px;
    max-height: 100vh;
    height: auto;

    margin: 0 auto;
    padding: 40px 40px 0 40px;

    &--bottom-padding {
      margin: 0;
      padding-top: 24px;
    }
  }
}

.ModalTemplate-seperator {
  border: 1px solid $c-border-grey;
  width: 100%;
  height: 1px;
}

.ModalTemplate-buttons {
  @include flex-container(row, flex-end);
  @include child-spacing(left, 16px);
}

@keyframes slideUp {
  0% {
    transform: translateY(100%);
  }

  100% {
    transform: translateY(0);
  }
}
</style>
