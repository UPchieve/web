<template>
  <div class="ModalTemplate" :class="{ 'ModalTemplate--important': important }">
    <div v-if="mobileMode" class="ModalTemplate-header">
      <div class="ModalTemplate-header-close-button" @click="handleCancel">
        <upchieve-icon icon="arrow" />
        <p>{{ backText }}</p>
      </div>
    </div>

    <div class="ModalTemplate-form">
      <slot />

      <template v-if="!mobileMode">
        <div class="ModalTemplate-seperator" />
        <div class="ModalTemplate-buttons">
          <large-button v-if="!alertModal" @click.native="handleCancel"
            >Cancel</large-button
          >
          <large-button
            primary
            @click.native="$emit('accept')"
            :disabled="!enableAccept"
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
import UpchieveIcon from "@/components/UpchieveIcon";

export default {
  components: { LargeButton, UpchieveIcon },
  props: {
    acceptText: { type: String, default: "Accept" },
    backText: { type: String, default: "Back" },
    enableAccept: Boolean,
    alertModal: Boolean,
    important: Boolean
  },
  computed: {
    ...mapGetters({ mobileMode: "app/mobileMode" })
  },
  methods: {
    handleCancel() {
      this.$emit("cancel");
      this.$store.dispatch("app/modal/hide");
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

    .UpchieveIcon {
      color: white;
      transform: rotateY(180deg) translateY(2px);
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
    max-height: 520px;
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
