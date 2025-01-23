<script setup lang="ts">
import { countWords } from '@/utils/word-count'
import { computed } from 'vue'

const props = defineProps<{
  text: string
}>()

const wordCount = computed(() => countWords(props.text))
const inflectedLabel = computed(() =>
  wordCount.value === 1 ? 'word' : 'words'
)
</script>

<template>
  <span>{{ wordCount }} {{ inflectedLabel }}</span>
</template>
