<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import { computed } from 'vue'
import { useStore } from 'vuex'

const { variant } = defineProps<{
  variant: 'primary' | 'secondary' | 'tertiary'
}>()

const store = useStore()
const isVolunteer = computed(() => store.getters['user/isVolunteer'])
const session = computed(() => store.state.user.session)

const reportSession = () => {
  store.dispatch('app/modal/show', {
    component: 'ReportSessionModal',
    data: {
      showTemplateButtons: false,
      currentSession: session.value,
    },
  })
}
</script>

<template>
  <large-button
    v-if="isVolunteer"
    @click="reportSession"
    type="button"
    :variant="variant"
  >
    Report
  </large-button>
</template>

<style lang="scss" scoped></style>
