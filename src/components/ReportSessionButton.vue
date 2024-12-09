<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import { computed } from 'vue'
import { useStore } from 'vuex'

const { variant } = defineProps<{
  variant: 'primary' | 'secondary' | 'tertiary'
}>()

const store = useStore()
const session = computed(() => store.state.user.session)

const reportSession = () => {
  store.dispatch('app/modal/show', {
    component: 'ReportSessionModal',
    data: {
      showTemplateButtons: false,
      currentSession: session.value,
      source: 'session',
    },
  })
}
</script>

<template>
  <large-button @click="reportSession" type="button" :variant="variant">
    Report
  </large-button>
</template>

<style lang="scss" scoped></style>
