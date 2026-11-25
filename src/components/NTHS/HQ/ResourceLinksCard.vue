<script setup lang="ts">
import ArrowIcon from '@/assets/arrow.svg'
import NTHSLink from '@/components/NTHS/HQ/NTHSLink.vue'
import type { NTHSHomeLink } from '@/services/NTHSGroupService'

defineProps<{ links: NTHSHomeLink[] }>()
</script>

<template>
  <section aria-labelledby="resources-title" data-testid="resource-links">
    <h2 id="resources-title" class="eyebrow">Resources</h2>
    <ul class="list">
      <li v-for="(item, index) in links" :key="index">
        <NTHSLink
          :href="item.link"
          class="row"
          data-testid="resource-link"
          v-ph:nthshq="'home.resource_link'"
        >
          <span class="text">
            <span class="title">{{ item.title }}</span>
            <span v-if="item.body" class="body">{{ item.body }}</span>
          </span>
          <span class="arrow" aria-hidden="true">
            <ArrowIcon class="arrow-icon" />
          </span>
        </NTHSLink>
      </li>
    </ul>
  </section>
</template>

<style scoped lang="scss">
.eyebrow {
  @include nths-quiet-eyebrow;
}
.list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: grid;
  gap: 12px;
}
.row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  background: $upchieve-white;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 16px;
  text-decoration: none;
}
.text {
  display: grid;
  min-width: 0;
}
.title {
  font-size: 16px;
  font-weight: 500;
  color: $c-soft-black;
}
.body {
  @include nths-page-subtitle;
  margin: 4px 0 0;
}
.arrow {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border: 1px solid $c-border-grey;
  border-radius: 50%;
}
.arrow-icon {
  width: 12px;
  height: 12px;
  fill: $c-soft-black;
}
</style>
