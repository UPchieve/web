<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import UserPlusIcon from '@/assets/user-plus.svg'
import LargeButton from '@/components/LargeButton.vue'
import StandingChip from '@/components/NTHS/HQ/StandingChip.vue'
import { useInviteLink } from '@/composables/useInviteLink'
import type { NTHSChapterImpactPublic } from '@upchieve/api-contracts/nths-groups'
import { NTHS_ROUTES } from '@/views/NTHS/nths-route-helpers'

const props = defineProps<{
  name?: string
  isGroupAdmin: boolean
  gated: boolean
  impact?: NTHSChapterImpactPublic
  inviteCode?: string
  referralCode: string
}>()

const router = useRouter()

const tabs = computed(() =>
  [
    { to: NTHS_ROUTES.home, name: 'home', label: 'Headquarters' },
    { to: NTHS_ROUTES.toDo, name: 'to_do', label: 'To Do', adminOnly: true },
    { to: NTHS_ROUTES.resources, name: 'resources', label: 'Resources' },
    {
      to: NTHS_ROUTES.manage,
      name: 'manage',
      label: 'Manage',
      adminOnly: true,
    },
  ].filter(({ adminOnly }) => !adminOnly || props.isGroupAdmin)
)

const { justCopied, copyLink } = useInviteLink(
  () => props.inviteCode ?? '',
  () => props.referralCode
)

// On narrow screens the tabs scroll sideways. A page opened directly on a later
// tab would otherwise show its active tab off-screen.
const tabsNav = ref<HTMLElement | null>(null)
function revealActiveTab() {
  tabsNav.value
    ?.querySelector('.tab.active')
    ?.scrollIntoView({ inline: 'nearest', block: 'nearest' })
}
watch(
  () => router.currentRoute.value.path,
  async () => {
    await nextTick()
    revealActiveTab()
    // Work Sans usually finishes loading after mount and widens every tab, which
    // pushes the active one back out of view.
    await document.fonts?.ready
    revealActiveTab()
  },
  { immediate: true }
)
</script>

<template>
  <div class="chapter-header">
    <div class="identity">
      <img class="seal" src="@/assets/nths/nths-logo.svg?url" alt="" />
      <div class="identity-text">
        <div v-if="!gated && impact" class="chip-row">
          <span class="status-label">Chapter status:</span>
          <StandingChip :impact="impact" />
        </div>
        <div class="title-line">
          <p class="chapter-name">{{ name }}</p>
          <LargeButton
            v-if="!gated && inviteCode"
            class="invite"
            variant="primary-blue"
            :showArrow="false"
            data-testid="header-invite"
            v-ph:nthshq="'header.invite.copy'"
            @click="copyLink"
          >
            <span class="invite-inner">
              <UserPlusIcon class="invite-icon" />
              <span class="invite-label">
                {{ justCopied ? 'Copied' : 'Copy invite' }}
              </span>
            </span>
          </LargeButton>
        </div>
      </div>
    </div>
    <nav v-if="!gated" ref="tabsNav" class="tabs" aria-label="Chapter sections">
      <RouterLink
        v-for="tab in tabs"
        :key="tab.to"
        class="tab"
        activeClass="active"
        :to="tab.to"
        v-ph:nthshq="`tab.${tab.name}`"
      >
        {{ tab.label }}
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped lang="scss">
$narrow: 'screen and (max-width: 600px)';
$fade: 40px;

.chapter-header {
  padding: clamp(18px, 3vw, 26px) clamp(16px, 4vw, 36px) 0;
}
.identity {
  display: flex;
  align-items: center;
  gap: 16px;

  @media #{$narrow} {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr) 44px;
    grid-template-rows: auto auto;
    align-content: center;
    gap: 2px 16px;
  }
}
.seal {
  width: 114px;
  height: 114px;
  flex: none;
  background: $upchieve-white;
  border-radius: 9999px;
  padding: 5px;

  @media #{$narrow} {
    width: 64px;
    height: 64px;
    grid-column: 1;
    grid-row: 1 / 3;
  }
}
.identity-text {
  flex: 1;
  min-width: 0;

  @media #{$narrow} {
    display: contents;
  }
}
.status-label {
  @include visually-hidden;
}
.chip-row {
  @media #{$narrow} {
    grid-column: 2;
    grid-row: 1;
    align-self: end;
  }
}
.title-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 20px;

  @media #{$narrow} {
    display: contents;
  }
}
.chapter-name {
  font-size: 40px;
  font-weight: 500;
  line-height: 1.25;
  letter-spacing: -0.03em;
  margin: 0;

  @media #{$narrow} {
    grid-column: 2;
    grid-row: 2;
    align-self: start;
    font-size: 24px;
    text-wrap: balance;
  }
}
.identity .invite {
  min-height: 44px;

  @media #{$narrow} {
    grid-column: 3;
    grid-row: 1 / 3;
    align-self: center;
    width: 44px;
    height: 44px;
    padding: 0;
    border-radius: 50%;
    justify-content: center;
  }
}
.invite-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.invite-icon {
  width: 18px;
  height: 18px;
  flex: none;
}
.invite-label {
  @media #{$narrow} {
    @include visually-hidden;
  }
}
.tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  // The right padding lets the last tab scroll clear of the fade.
  padding: 2px $fade 2px 2px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-padding-inline: $fade;
  scrollbar-width: none;
  mask-image: linear-gradient(
    to right,
    #000 calc(100% - #{$fade}),
    transparent
  );

  &::-webkit-scrollbar {
    display: none;
  }

  @media #{$narrow} {
    margin: 16px -16px 0;
    padding-left: 16px;
  }
}
.tab {
  display: inline-flex;
  align-items: center;
  flex: none;
  min-height: 44px;
  padding: 6px 16px;
  border: 1px solid $c-border-grey;
  border-radius: 20px;
  background: $upchieve-white;
  color: $c-soft-black;
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
  text-decoration: none;
  white-space: nowrap;

  &.active {
    background: $c-soft-black;
    border-color: $c-soft-black;
    color: $upchieve-white;
  }
  &:focus-visible {
    outline: 2px solid $c-information-blue;
    outline-offset: 1px;
  }

  @media #{$narrow} {
    min-height: 36px;
    padding-block: 4px;
  }
}
</style>
