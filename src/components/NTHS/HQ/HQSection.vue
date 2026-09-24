<script setup lang="ts">
defineProps<{
  eyebrow?: string
  muted?: boolean
}>()
</script>

<template>
  <section class="hq-section">
    <header v-if="eyebrow || $slots['header-end']" class="hq-section-header">
      <span v-if="eyebrow" class="hq-section-eyebrow" :class="{ muted }">{{
        eyebrow
      }}</span>
      <span class="hq-section-header-end"><slot name="header-end" /></span>
    </header>
    <slot />
  </section>
</template>

<style scoped lang="scss">
.hq-section {
  @include nths-card(22px 24px);
  text-align: left;
}
.hq-section-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
}
.hq-section-eyebrow {
  @include nths-section-eyebrow;
  color: $c-nths-navy;
}
.hq-section-eyebrow.muted {
  @include nths-card-eyebrow;
  color: $c-secondary-grey;
}
.hq-section-header-end {
  margin-left: auto;
}
</style>
