<script setup lang="ts">
import { countWords } from '@/utils/word-count'
import { computed } from 'vue'

const props = defineProps<{
  selectedText: string
  text: string
}>()

const selectedWordCount = computed(() => countWords(props.selectedText))

const wordCount = computed(() => countWords(props.text))
const inflectedLabel = computed(() =>
  wordCount.value === 1 ? 'word' : 'words'
)
</script>

<template>
  <div>
    <span v-if="selectedWordCount">{{ selectedWordCount }} / </span>
    <span>{{ wordCount }} {{ inflectedLabel }}</span>
  </div>
</template>
