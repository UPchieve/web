<script setup lang="ts">
import { computed, ref } from 'vue'

const LIMIT = 3

const props = defineProps<{ subjects: string[] }>()

const expanded = ref(false)
const hiddenCount = computed(() => Math.max(props.subjects.length - LIMIT, 0))
const shown = computed(() =>
  expanded.value ? props.subjects : props.subjects.slice(0, LIMIT)
)
</script>

<template>
  <span v-if="!subjects.length" class="none">None yet</span>
  <span v-else class="subjects">
    <span data-testid="subject-names">{{ shown.join(', ') }}</span>
    <button
      v-if="hiddenCount"
      type="button"
      data-testid="subjects-toggle"
      class="more"
      :aria-expanded="expanded"
      @click="expanded = !expanded"
    >
      {{ expanded ? 'Show less' : `+${hiddenCount} more` }}
    </button>
  </span>
</template>

<style scoped lang="scss">
.none {
  color: $c-secondary-grey;
}
.more {
  margin-left: 6px;
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: $c-information-blue;
  text-decoration: underline;
  cursor: pointer;

  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 2px;
  }
}
</style>
