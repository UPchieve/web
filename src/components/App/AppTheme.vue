<script lang="ts" setup>
import { computed, watch } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const isS2VThemingEnabled = computed(
  () => store.getters['featureFlags/isS2VThemingEnabled']
)
const isVolunteer = computed(
  () => store.getters['user/userType'] === 'volunteer'
)
watch(
  () => isVolunteer.value && isS2VThemingEnabled.value,
  (isEnabled) => {
    if (isEnabled) {
      document.documentElement.setAttribute('data-theme', 'coach')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }
)
</script>

<template>
  <slot></slot>
</template>

<style lang="scss" module>
:root {
  --text-color: #{$c-soft-black};
  --secondary-text-color: #{$c-secondary-grey};
  --bg-color: #{$upchieve-white};
  --switch-role-button-color: #{$c-information-blue};
}
[data-theme='coach'] {
  --text-color: #{$upchieve-white};
  --secondary-text-color: #e8e6e6;
  --bg-color: #16213a;
  --switch-role-button-color: #b2c8f7;
}
</style>
