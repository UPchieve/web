<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import CrossIcon from '@/assets/cross.svg'
import type { RootState } from '@/store'

const store = useStore<RootState>()
const errors = computed(() => store.state.botConversations.errors)
const dismiss = () => store.dispatch('botConversations/clearErrors')
</script>

<template>
  <div v-if="errors.length">
    <div class="errors" v-for="error in errors" v-bind:key="error">
      {{ error }}
      <button type="button" class="close-button">
        <cross-icon class="cross-icon-svg" @click="dismiss" />
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
  padding: 12px 8px 12px 18px;
  background-color: $c-error-red;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-button {
  transform: scale(0.5);
  stroke: white !important;
  stroke-width: 2px !important;
}
.close-button:hover {
  filter: brightness(0.9);
}
</style>
