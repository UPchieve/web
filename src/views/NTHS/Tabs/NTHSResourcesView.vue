<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useChapterContext } from '@/composables/useChapterContext'
import NTHSLink from '@/components/NTHS/HQ/NTHSLink.vue'
import Spinner from '@/components/Spinner.vue'
import ResourceIcon from '@/components/NTHS/HQ/ResourceIcon.vue'
import { getNTHSResources } from '@/services/NetworkService'
import { isAppPath, NTHS_RESOURCES_URL } from '@/services/NTHSGroupService'
import type { NTHSResources } from '@upchieve/api-contracts/nths-groups'
import { useStore } from 'vuex'
import ChevronDownIcon from '@/assets/chevron-down.svg'
import ArrowUpRightIcon from '@/assets/icons/resources/arrow-up-right.svg'

const { groupId } = useChapterContext()

const resources = ref<NTHSResources>()
const loaded = ref(false)
const groups = computed(() => resources.value?.groups ?? [])

const isMobile = useStore().getters['app/mobileMode'] as boolean
const toggledSections = ref(new Set<number>())

function toggleSection(index: number) {
  const toggled = new Set(toggledSections.value)
  if (toggled.has(index)) {
    toggled.delete(index)
  } else {
    toggled.add(index)
  }
  toggledSections.value = toggled
}

function isCollapsed(index: number) {
  return isMobile && index > 0 !== toggledSections.value.has(index)
}

onBeforeMount(async () => {
  if (groupId.value) {
    resources.value = await getNTHSResources(groupId.value).catch(
      () => undefined
    )
  }
  loaded.value = true
})
</script>

<template>
  <div class="resources">
    <h1 class="visually-hidden">Resources</h1>

    <Spinner v-if="!loaded" data-testid="resources-loading" />

    <ul v-else-if="groups.length" class="groups">
      <li
        v-for="(group, index) in groups"
        :key="index"
        class="group"
        :class="`tint-${index % 4}`"
        data-testid="resource-group"
      >
        <div class="band-row">
          <h2 class="band-heading">
            <component
              :is="isMobile ? 'button' : 'span'"
              class="band"
              v-bind="
                isMobile
                  ? {
                      type: 'button',
                      'aria-expanded': !isCollapsed(index),
                      'aria-controls': isCollapsed(index)
                        ? undefined
                        : `resource-group-${index}`,
                    }
                  : {}
              "
              @click="isMobile && toggleSection(index)"
            >
              <ResourceIcon :name="group.icon" class="band-icon" />
              <span class="group-title">{{ group.title }}</span>
              <ChevronDownIcon
                v-if="isMobile"
                class="chevron"
                :class="{ open: !isCollapsed(index) }"
                aria-hidden="true"
              />
            </component>
          </h2>
          <span v-if="group.subtitle" class="tagline">{{
            group.subtitle
          }}</span>
        </div>

        <ul
          v-if="!isCollapsed(index)"
          :id="`resource-group-${index}`"
          class="tiles"
        >
          <li v-for="(card, cardIndex) in group.cards" :key="cardIndex">
            <NTHSLink
              :href="card.link"
              class="tile"
              data-testid="resource-tile"
              v-ph:nthshq="'resources.link'"
            >
              <ResourceIcon :name="card.icon" class="tile-icon" />
              <span class="tile-text">
                <span class="tile-title">{{ card.title }}</span>
                <span v-if="card.body" class="tile-body">{{ card.body }}</span>
              </span>
              <ArrowUpRightIcon class="tile-arrow" aria-hidden="true" />
              <span v-if="!isAppPath(card.link)" class="visually-hidden"
                >(opens in a new tab)</span
              >
            </NTHSLink>
          </li>
        </ul>
      </li>
    </ul>

    <p v-else class="fallback" data-testid="resources-fallback">
      <a
        v-ph:nthshq="'resources.fallback'"
        :href="NTHS_RESOURCES_URL"
        data-testid="resources-fallback-link"
        target="_blank"
        rel="noopener noreferrer"
        >Find guides and templates at nationaltutor.org/resources.<span
          class="visually-hidden"
          >(opens in a new tab)</span
        ></a
      >
    </p>
  </div>
</template>

<style scoped lang="scss">
.resources {
  @include nths-tab-column(1060px);
}
.groups {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;

  @include breakpoint-above('medium') {
    gap: 24px;
  }
}
.group {
  @include nths-card(0);
  overflow: hidden;
}
.tint-0 .band-row {
  background: rgba($c-warning-orange, 0.35);
}
.tint-1 .band-row {
  background: rgba($c-teacher, 0.25);
}
.tint-2 .band-row {
  background: rgba($c-information-blue, 0.12);
}
.tint-3 .band-row {
  background: rgba($c-success-green, 0.25);
}
.band-row {
  display: flex;
  align-items: center;
  gap: 16px;
  color: $c-soft-black;

  @include breakpoint-above('medium') {
    padding: 16px 24px;
  }
}
.band-heading {
  margin: 0;
  flex: 1 1 0;
  min-width: 0;
}
.band {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 0;
  border: 0;
  background: none;
  text-align: left;
  font: inherit;
  color: inherit;
}
button.band {
  cursor: pointer;
  padding: 8px 16px;
  min-height: 56px;

  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: -2px;
  }
}
.band-icon {
  flex: none;
  width: 24px;
  height: 24px;
}
.group-title {
  flex: 1;
  font-size: 18px;
  font-weight: 500;
  line-height: 22.5px;
}
.tagline {
  display: none;
  flex: 0 1 auto;
  max-width: 45%;
  overflow-wrap: anywhere;
  text-align: right;
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;

  @include breakpoint-above('medium') {
    display: block;
  }
}
.chevron {
  flex: none;
  width: 20px;
  height: 20px;
  transition: transform 150ms ease;
}
.chevron.open {
  transform: rotate(180deg);
}
.tiles {
  list-style: none;
  margin: 0;
  padding: 0;

  li + li {
    border-top: 1px solid $c-border-grey;
  }

  @include breakpoint-above('medium') {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    padding: 20px 24px 24px;

    li + li {
      border-top: 0;
    }
  }

  // The sidebar leaves three columns too narrow for a tile's words below 1024px.
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.tile {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 44px;
  height: 100%;
  padding: 16px;
  background: $upchieve-white;
  color: $c-soft-black;
  text-decoration: none;

  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: -2px;
  }

  @include breakpoint-above('medium') {
    align-items: flex-start;
    border: 1px solid $c-border-grey;
    border-radius: 8px;

    &:hover {
      background: $c-nths-sky;
    }
  }
}
.tile-icon {
  display: none;
  flex: none;
  width: 20px;
  height: 20px;
  margin-top: 2px;

  @include breakpoint-above('medium') {
    display: block;
  }
}
.tile-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}
.tile-title {
  font-size: 16px;
  font-weight: 500;
  line-height: 20px;

  @include breakpoint-above('medium') {
    font-size: 18px;
    font-weight: 400;
    line-height: 22.5px;
  }
}
.tile-body {
  font-size: 14px;
  line-height: 21px;
  color: $c-secondary-grey;
}
.tile-arrow {
  flex: none;
  width: 16px;
  height: 16px;

  @include breakpoint-above('medium') {
    display: none;
  }
}
.fallback {
  @include nths-notice;
}
</style>
