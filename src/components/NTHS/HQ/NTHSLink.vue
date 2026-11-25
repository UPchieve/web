<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { isAppPath } from '@/services/NTHSGroupService'

defineProps<{ href: string }>()
</script>

<template>
  <RouterLink v-if="isAppPath(href)" :to="href"><slot /></RouterLink>
  <a v-else :href="href" target="_blank" rel="noopener noreferrer"><slot /></a>
</template>
