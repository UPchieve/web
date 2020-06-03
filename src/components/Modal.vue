<template>
  <div
    class="modal"
    :class="{ 'modal--important': important }"
    @click="handleClose"
  >
    <div v-if="mobileMode" class="modal-header">
      <div class="modal-header-close-button" @click="closeModal">
        <arrow-icon class="icon" />
        <p>{{ backText }}</p>
      </div>
    </div>

    <div class="modal-form">
      <slot />

      <div class="modal-form--bottom-padding" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import ArrowIcon from "@/assets/arrow.svg";

export default {
  components: { ArrowIcon },
  props: {
    closeModal: { type: Function, required: true },
    important: Boolean
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
    handleClose(event) {
      const { target } = event;
      if (target.classList.contains("modal")) this.closeModal();
    }
  }
};
</script>

<style lang="scss" scoped></style>
