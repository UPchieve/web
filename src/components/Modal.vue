<script lang="ts" setup>
import { useStore } from 'vuex'
import ArrowIcon from '@/assets/arrow.svg'
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  closeModal: Function,
  important: Boolean,
  backText: { type: String, default: 'Back' },
  disableModalMobileMode: { type: Boolean, default: false, required: false },
})

const store = useStore()

onMounted(() => {
  const body = document.querySelector('body')
  body?.classList.add('disable-scroll')
})

onUnmounted(() => {
  const body = document.querySelector('body')
  body?.classList.remove('disable-scroll')
})

const mobileMode = computed(() => store.getters['app/mobileMode'])

//TODO: Allow modal to hide itself of parent's v-if.
//The closeModal func prop should be an trigger after the dialog closes/hides/destroys itself
function handleClose(event: MouseEvent) {
  const { target } = event
  const targetHtmlElement = target as HTMLElement

  if (props.closeModal && targetHtmlElement?.classList?.contains('upc-modal')) {
    props.closeModal()
  }
}
</script>

<template>
  <div
    class="upc-modal"
    :class="{
      'modal--important': important,
      'upc-modal--disable-mobile': disableModalMobileMode,
    }"
    @click="handleClose"
  >
    <div v-if="mobileMode && !disableModalMobileMode" class="upc-modal-header">
      <div
        v-if="backText"
        class="upc-modal-header-close-button"
        @click="handleClose"
      >
        <arrow-icon class="icon" />
        <p>{{ backText }}</p>
      </div>
    </div>

    <div class="upc-modal-form">
      <slot />

      <div class="upc-modal-form--bottom-padding" />
    </div>
  </div>
</template>
