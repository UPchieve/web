<script lang="ts" setup>
defineProps<{ show: boolean }>()
defineEmits<{ click: [] }>()
</script>

<template>
  <transition name="fade">
    <button
      v-show="show"
      type="button"
      class="scroll-to-latest"
      aria-label="Scroll to latest message"
      @click="$emit('click')"
    >
      <slot />
      <img src="@/assets/down_arrow.png" alt="" aria-hidden="true" />
    </button>
  </transition>
</template>

<style lang="scss" scoped>
.scroll-to-latest {
  position: absolute;
  bottom: 4em;
  left: 50%;
  transform: translateX(-50%);
  background-color: $c-information-blue;
  border: 0;
  border-radius: 12px;
  padding: 0.4em 0.8em;
  color: $upchieve-white;
  box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.35);
  cursor: pointer;
  transition: 0.25s;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
