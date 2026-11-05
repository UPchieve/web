<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { useDocumentVisibility } from '@vueuse/core'
import LargeButton from '@/components/LargeButton.vue'
import ModalService from '@/services/ModalService'
import type { GroupMember } from '@/services/NTHSGroupService'
import Callout from '@/components/Callout.vue'
import RenewalBanner from '@/components/NTHS/Renewal/RenewalBanner.vue'
import LoggerService from '@/services/LoggerService'
import { renewalWarningLine } from '@/services/NTHSRenewalService'
import { resolveNthsRoute } from '@/views/NTHS/nths-route-helpers'
import { useNthsStore } from '@/stores/nths'

const store = useStore()
const nths = useNthsStore()
const router = useRouter()
const group = computed(() => nths.NTHSGroups?.[0])
const isGroupAdmin = computed(() => nths.hasAdminRole)

const tabs = computed(() =>
  [
    { to: '/groups/home', name: 'home', label: 'Home' },
    { to: '/groups/to-do', name: 'to_do', label: 'To do', adminOnly: true },
    { to: '/groups/members', name: 'members', label: 'Members' },
    { to: '/groups/resources', name: 'resources', label: 'Resources' },
    { to: '/groups/setup', name: 'setup', label: 'Chapter setup' },
  ].filter(({ adminOnly }) => !adminOnly || isGroupAdmin.value)
)

const hidePageContentReason = computed(function ():
  | 'not ready to tutor'
  | 'no occupation'
  | 'not in high school'
  | undefined {
  // Hide page content that could contain member information, such as first names,
  // until the user has confirmed they are a high school student, and (for
  // non-admins) is onboarded and approved.
  if (!store.getters['user/isVolunteerInHighSchool']) {
    return store.state.user.user.occupation?.length
      ? 'not in high school'
      : 'no occupation'
  }
  if (isGroupAdmin.value) return

  if (store.getters['volunteer/isOnboardedAndApproved']) return
  return 'not ready to tutor'
})

const chapterName = computed(
  () => group.value?.groupInfo?.name ?? 'your chapter'
)

const renewalLine = computed(() =>
  group.value?.renewal ? renewalWarningLine(group.value.renewal) : undefined
)

const hidePageContentMessage = computed(() => {
  switch (hidePageContentReason.value) {
    case 'not ready to tutor':
      return `Finish the volunteer Onboarding and Safety Screening tasks on the dashboard to view your NTHS Chapter details`
    case 'no occupation':
      return `We don't have your occupation on file yet. National Tutoring Honor Society is for high school students, so add your background info to see ${chapterName.value}. Not in high school? You can leave the chapter and keep coaching with UPchieve.`
    default:
      return `Your profile says you're not in high school. National Tutoring Honor Society is for current high school students, so ${chapterName.value} is unavailable for now. In high school? Update your profile. If not, you can leave the chapter and keep coaching with UPchieve.`
  }
})

const profileAction = computed(() =>
  hidePageContentReason.value === 'no occupation'
    ? {
        label: 'Add background info',
        path: '/background-information',
        phLabel: 'add_background_info',
      }
    : { label: 'Update profile', path: '/profile', phLabel: 'update_profile' }
)

function goToDashboard() {
  router.push('/dashboard')
}

// The members list is refused to gated members, so the self member comes from the store.
function onLeaveChapter() {
  const nthsGroupId = group.value?.groupInfo?.id
  if (!nthsGroupId) return
  ModalService.showLeaveTeamModal({
    isRemovingSelf: true,
    memberToRemove: {
      userId: store.state.user.user.id,
      nthsGroupId,
    } as GroupMember,
  })
}

let isUnmounted = false
onBeforeUnmount(() => {
  isUnmounted = true
})

// loadNTHSData skips the fetch once groups are loaded, so renewal prompts
// would otherwise stay as they were when the coach first opened Chapter HQ.
async function refreshNTHSData(): Promise<void> {
  try {
    const groups = await nths.refreshNTHSGroups()
    // The /groups route guard runs only on entry, so a coach removed mid-visit is moved here.
    if (!groups.length) {
      const redirect = await resolveNthsRoute(
        store,
        'group',
        router.currentRoute.value.path
      )
      if (redirect && !isUnmounted) {
        await router.replace(redirect)
      }
    }
  } catch (err) {
    LoggerService.noticeError(err, 'Could not refresh NTHS data')
  }
}

onMounted(() => {
  void refreshNTHSData()
})

watch(
  () => router.currentRoute.value.path,
  () => void refreshNTHSData()
)

// The renewal countdown reads today's date, which nothing reactive changes in
// a tab left open overnight.
watch(useDocumentVisibility(), (visibility) => {
  if (visibility === 'visible') {
    void refreshNTHSData()
  }
})

// The tab strip scrolls horizontally below ~1100px. Landing directly on a tab
// route (e.g. from the checklist's "Edit in Chapter setup") mounts the active
// tab already off the visible strip, with no scroll event to reveal it.
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
  <div class="chapter-hq">
    <div class="band">
      <div class="identity">
        <img class="logo" src="@/assets/nths/nths-logo.svg?url" alt="" />
        <div class="identity-text">
          <p class="band-eyebrow">National Tutoring Honor Society</p>
          <p class="chapter-name">{{ group?.groupInfo?.name }}</p>
        </div>
      </div>
      <nav
        class="tabs"
        ref="tabsNav"
        v-if="!hidePageContentReason"
        aria-label="Chapter sections"
      >
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

    <div class="content">
      <div
        v-if="hidePageContentReason"
        class="hide-content-container"
        data-testid="hide-page-content"
      >
        <Callout variant="warning">
          <template v-slot:content>
            <div class="callout-content">
              <p
                v-if="renewalLine"
                class="warning-line"
                data-testid="renewal-warning-line"
              >
                {{ renewalLine }}
              </p>
              {{ hidePageContentMessage }}
              <LargeButton
                v-if="hidePageContentReason === 'not ready to tutor'"
                variant="primary-blue"
                :showArrow="false"
                v-ph:nthshq="'go_to_dashboard'"
                @click="goToDashboard"
              >
                Continue Onboarding
              </LargeButton>
              <template v-else>
                <LargeButton
                  variant="primary-blue"
                  :showArrow="false"
                  v-ph:nthshq="profileAction.phLabel"
                  @click="router.push(profileAction.path)"
                >
                  {{ profileAction.label }}
                </LargeButton>
                <LargeButton
                  variant="secondary"
                  :showArrow="false"
                  v-ph:nthshq="'leave_chapter'"
                  @click="onLeaveChapter"
                >
                  Leave chapter
                </LargeButton>
              </template>
            </div>
          </template>
        </Callout>
      </div>
      <template v-else>
        <RenewalBanner
          v-if="group?.groupInfo?.id"
          :groupId="group.groupInfo.id"
        />
        <RouterView />
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chapter-hq {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: auto;
  background: $c-background-grey;
  color: $c-soft-black;
  text-align: left;
}
.band {
  background: $c-nths-navy;
  color: $upchieve-white;
  padding: clamp(18px, 3vw, 26px) clamp(16px, 4vw, 36px) 0;
}
.identity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 18px;
  padding-bottom: 22px;
}
.logo {
  height: 56px;
  width: 56px;
  flex: none;
  background: $c-nths-cream;
  border-radius: 9999px;
  padding: 5px;
}
.identity-text {
  flex: 1;
}
.band-eyebrow {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: $c-college;
}
.chapter-name {
  font-size: 26px;
  font-weight: 500;
  line-height: 1.25;
  margin-top: 5px;
}
.tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.tab {
  padding: 11px 16px;
  border-radius: 8px 8px 0 0;
  flex: none;
  white-space: nowrap;
  font-size: 15px;
  font-weight: 500;
  line-height: 1.2;
  background: rgba(255, 255, 255, 0.12);
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
}
// The active tab takes the page background so it reads as a folder tab
// joined to the content below.
.tab.active {
  background: $c-background-grey;
  color: $c-nths-navy;
}
.content {
  flex: 1;
  min-width: 0;
  padding: clamp(20px, 3vw, 30px) clamp(16px, 4vw, 36px) 40px;
}
.hide-content-container {
  width: 80%;

  @include breakpoint-below('medium') {
    width: 100%;
  }
}
.warning-line {
  margin: 0 0 12px;
}
.callout-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  padding-bottom: 8px;
}
</style>
