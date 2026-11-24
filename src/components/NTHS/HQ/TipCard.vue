<script setup lang="ts">
defineProps<{ tip: string }>()
</script>

<template>
  <section aria-labelledby="tip-title" data-testid="tip">
    <h2 id="tip-title" class="eyebrow">Tip</h2>
    <p class="line">{{ tip }}</p>
  </section>
</template>

<style scoped lang="scss">
.eyebrow {
  @include nths-section-eyebrow;
  color: $c-secondary-grey;
  margin: 0;
}
.line {
  font-family: Georgia, 'Times New Roman', serif;
  font-style: italic;
  font-size: 22px;
  line-height: 1.35;
  color: $c-soft-black;
  margin: 10px 0 0;
}
</style>
