<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import {
  NTHS_ORIENTATION_URL,
  NTHS_RESOURCES_URL,
} from '@/services/NTHSGroupService'
import GraduationCap from '@/assets/icons/graduation_cap_icon.svg'
import OpenBook from '@/assets/icons/open_book_icon.svg'

const store = useStore()
const isGroupAdmin = computed(() => store.getters['nths/hasAdminRole'])

const allResources = [
  {
    icon: GraduationCap,
    title: 'President orientation',
    body: 'The walkthrough of what running an NTHS chapter asks of you.',
    linkText: 'Open orientation',
    url: NTHS_ORIENTATION_URL,
    adminOnly: true,
  },
  {
    icon: OpenBook,
    title: 'NTHS resource library',
    body: 'Guides, templates and recruiting material for your chapter.',
    linkText: 'View resources',
    url: NTHS_RESOURCES_URL,
    adminOnly: false,
  },
]
const resources = computed(() =>
  allResources.filter(({ adminOnly }) => isGroupAdmin.value || !adminOnly)
)
</script>

<template>
  <div class="resources">
    <h1 class="page-title">Resources</h1>

    <div>
      <div class="group-header">
        <span class="group-eyebrow">Get started</span>
        <span class="group-blurb">Everything lives on nationaltutor.org.</span>
      </div>
      <div class="card-grid">
        <a
          v-for="resource in resources"
          :key="resource.url"
          class="resource-card"
          :href="resource.url"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="icon-disc">
            <component :is="resource.icon" class="icon" aria-hidden="true" />
          </span>
          <span class="resource-title">{{ resource.title }}</span>
          <span class="resource-body">{{ resource.body }}</span>
          <span class="resource-link">{{ resource.linkText }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.resources {
  @include nths-tab-column(1060px);
}
.page-title {
  @include nths-page-title;
}
.group-header {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 12px;
}
.group-eyebrow {
  @include nths-section-eyebrow;
  color: $c-nths-navy;
}
.group-blurb {
  font-size: 13px;
  line-height: 1.4;
  color: $c-secondary-grey;
}
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 16px;
  margin-top: 14px;
}
.resource-card {
  @include nths-card(22px);
  display: flex;
  flex-direction: column;
  gap: 10px;

  // The whole card is the anchor, so it inherits the global anchor color and
  // hover underline; reset both here and let .resource-link carry its own blue.
  color: $c-soft-black;
  text-decoration: none;

  &:hover {
    border-color: $c-information-blue;

    .resource-link {
      text-decoration: underline;
    }
  }
}
.icon-disc {
  width: 40px;
  height: 40px;
  flex: none;
  border-radius: 9999px;
  background: $c-nths-cream;
  border: 1px solid $c-college;
  display: flex;
  align-items: center;
  justify-content: center;
}
.icon {
  width: 19px;
  height: 19px;
  opacity: 0.75;
}
.resource-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.35;
}
.resource-body {
  @include nths-page-subtitle;
  flex: 1;
}
.resource-link {
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  color: $c-information-blue;
}
</style>
