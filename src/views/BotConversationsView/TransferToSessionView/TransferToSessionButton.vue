<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import VolunteerIcon from '@/assets/volunteer-icon.svg'

const props = defineProps<{
  onClick: () => void
  disableButton: false
}>()
</script>

<template>
  <LargeButton
    :show-arrow="false"
    class="transfer-button"
    primary
    @click="props.onClick"
    :disabled="disableButton"
    :class="{
      'enabled-button': !disableButton,
    }"
  >
    <div class="button-content-container">
      <VolunteerIcon class="volunteer-icon" />
      Transfer to a live tutor
    </div>
  </LargeButton>
</template>

<style lang="scss" scoped>
.button-content-container {
  display: flex;
  align-items: center;
  gap: 4px;
}

.transfer-button {
  background-color: $c-information-blue;
  border-radius: 200px;
  height: 48px;
}

.enabled-button {
  &:hover {
    background-color: $c-information-blue;
  }
}

.volunteer-icon {
  padding-right: 10px;
}
</style>
