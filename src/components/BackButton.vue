<script lang="ts" setup>
defineEmits(['click'])
</script>
<template>
  <button
    type="button"
    class="uc-form-button-back-button"
    @click="(event) => $emit('click', event)"
  >
    ← Back
  </button>
</template>
