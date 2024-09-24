<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import CrossIcon from '@/assets/cross.svg'

const store = useStore()
let errors = computed(() => store.state.botConversations.errors)
const dismiss = () => store.dispatch('botConversations/clearErrors')
</script>

<template>
  <div v-if="errors.length">
    <div class="errors" v-for="error in errors" v-bind:key="error">
      {{ error }}
      <button class="close-button">
        <cross-icon @click="dismiss" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.errors {
  color: white;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 12px 24px;
  background-color: $c-error-red;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  transform: scale(0.5);
  fill: white;
}
.close-button:hover {
  transform: scale(0.625);
}
</style>
