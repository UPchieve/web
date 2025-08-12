<script lang="ts" setup>
import { IonProgressBar } from '@ionic/vue'
import { computed } from 'vue'

const props = defineProps<{
  percentProgress: number
  showPercentLabel: boolean
}>()

const decimalProgress = computed(() => {
  return props.percentProgress / 100.0
})
</script>

<template>
  <div class="continuous-progress-bar">
    <IonProgressBar :value="decimalProgress" />
    <span v-if="props.showPercentLabel">{{ percentProgress }}%</span>
  </div>
</template>

<style lang="scss">
ion-progress-bar::part(track) {
  background: $c-border-grey;
}
ion-progress-bar::part(progress) {
  background: $c-success-green;
}
</style>

<style lang="scss" scoped>
.continuous-progress-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 22px;
}
</style>
