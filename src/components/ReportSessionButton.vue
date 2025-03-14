<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import { computed } from 'vue'
import { useStore } from 'vuex'

const props = defineProps({
  variant: {
    type: String,
    default: 'tertiary',
  },
  icon: {
    type: String,
    required: false,
  },
})

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
  <large-button @click="reportSession" type="button" :variant="props.variant">
    <component v-if="props.icon" :is="props.icon" />
    Report
  </large-button>
</template>

<style lang="scss" scoped></style>
