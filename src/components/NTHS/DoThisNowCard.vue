<script setup lang="ts">
import { computed } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import { formatDueDate, showsDueDate } from '@/services/NTHSChecklistService'
import type { NTHSChecklistItemPublic } from '@upchieve/api-contracts/nths-checklist'

const props = defineProps<{ item: NTHSChecklistItemPublic }>()

const resource = computed(() => props.item.resources.find((r) => r.url))
const due = computed(() =>
  props.item.dueDate && showsDueDate(props.item.dueDate)
    ? formatDueDate(props.item.dueDate)
    : ''
)
</script>

<template>
  <section
    class="do-this-now"
    aria-labelledby="do-this-now-heading"
    data-testid="do-this-now"
  >
    <h2 id="do-this-now-heading" class="eyebrow">Do this now</h2>
    <p class="big" data-testid="do-this-now-title">
      {{ item.title }}
    </p>
    <p v-if="item.description" class="description">{{ item.description }}</p>
    <div v-if="resource || due" class="actions">
      <LargeButton
        v-if="resource"
        variant="primary-blue"
        :showArrow="false"
        :routeTo="resource.url"
        target="_blank"
        rel="noopener noreferrer"
        data-testid="do-this-now-button"
      >
        {{ resource.label }}
      </LargeButton>
      <span v-if="due" class="due" data-testid="do-this-now-due">
        Due {{ due }}
      </span>
    </div>
  </section>
</template>

<style scoped lang="scss">
.do-this-now {
  @include nths-card;
}
.eyebrow {
  @include nths-card-eyebrow;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.96px;
  color: $c-soft-black;
  margin: 0;
}
.big {
  color: $c-soft-black;
  font-size: 40px;
  font-weight: 500;
  line-height: 50px;
  margin: 8px 0;
}
.description {
  color: $c-secondary-grey;
  font-size: 16px;
  line-height: 24px;
  margin: 0 0 16px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 16px;
}
.due {
  color: $c-secondary-grey;
  font-size: 16px;
}
</style>
