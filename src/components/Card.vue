<script lang="ts" setup>
import CrossIcon from '@/assets/heavy-cross.svg'

export type DismissOptions = {
  onDismiss: () => void
}

export type CardProps = {
  title: string
  subtitle: string
  dismissOptions?: DismissOptions
}
const props = defineProps<CardProps>()
</script>

<template>
  <div class="card-main">
    <div
      v-if="props.dismissOptions"
      class="dismiss-button"
      type="button"
      @click="props.dismissOptions.onDismiss"
    >
      <CrossIcon class="dismiss-icon" />
    </div>
    <slot name="icon" />
    <div class="heading-container">
      <slot name="heading-content" />
      <div class="title">{{ props.title }}</div>
      <div v-if="props.subtitle" class="subtitle">{{ props.subtitle }}</div>
    </div>
    <slot name="content" />
  </div>
</template>

<style lang="scss" scoped>
.card-main {
  background: #fff;
  border-radius: 8px;
  padding: 4.5% 1%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.heading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 16px;
  gap: 8px;
  width: 90%;

  .title {
    @include font-category('display-small');
    text-align: center;
    width: 80%;
  }

  .subtitle {
    @include font-category('body');
    color: $c-secondary-grey;
    text-align: center;
  }
}

.dismiss-button {
  display: flex;
  flex-direction: column;
  margin-right: 3%;
  align-self: flex-end;
}

.dismiss-icon :deep(path) {
  stroke-width: 2;
}
</style>
