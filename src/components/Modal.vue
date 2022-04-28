<template>
  <div
    class="upc-modal"
    :class="{ 'modal--important': important, 'upc-modal--disable-mobile': disableModalMobileMode }"
    @click="handleClose"
  >
    <div v-if="mobileMode && !disableModalMobileMode" class="upc-modal-header">
      <div
        v-if="backText"
        class="upc-modal-header-close-button"
        @click="closeModal"
      >
        <arrow-icon class="icon" />
        <p>{{ backText }}</p>
      </div>
    </div>

    <div class="upc-modal-form" :style="{ padding: !useDefaultPadding && 0 }">
      <slot />

      <div class="upc-modal-form--bottom-padding" />
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ArrowIcon from '@/assets/arrow.svg'

export default {
  components: { ArrowIcon },
  props: {
    closeModal: { type: Function, required: true },
    important: Boolean,
    backText: { type: String, default: 'Back' },
    useDefaultPadding: { type: Boolean, default: true, required: false },
    disableModalMobileMode: { type: Boolean, default: false, required: false }
  },
  mounted() {
    const body = document.querySelector('body')
    body.classList.add('disable-scroll')
  },
  beforeDestroy() {
    const body = document.querySelector('body')
    body.classList.remove('disable-scroll')
  },
  computed: {
    ...mapGetters({ mobileMode: 'app/mobileMode' })
  },
  methods: {
    handleClose(event) {
      const { target } = event
      if (target.classList.contains('upc-modal')) this.closeModal()
    }
  }
}
</script>

<style lang="scss" scoped></style>
