<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import LargeButton from '@/components/LargeButton.vue'
import { VolunteerOccupations } from '@/services/VolunteerService'
import Callout from '@/components/Callout.vue'

const store = useStore()
const router = useRouter()
const group = computed(() => store.state.nths.NTHSGroups?.[0])
const isGroupAdmin = computed(() => store.getters['nths/hasAdminRole'])

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
  | 'not in high school'
  | undefined {
  // Hide page content that could contain member information, such as first names,
  // until the user is onboarded, approved, and has confirmed they are a high school student.
  // Admins are an exception.
  if (isGroupAdmin.value) return
  const occupations = store.state.user.user.occupation
  const isHighSchoolStudent =
    occupations &&
    occupations.includes(VolunteerOccupations.HIGH_SCHOOL_STUDENT)
  if (!isHighSchoolStudent) return 'not in high school'

  const isReadyToTutor = store.getters['volunteer/isReadyToTutor']
  if (isReadyToTutor) return
  return 'not ready to tutor'
})

const hidePageContentMessage = computed(() => {
  if (hidePageContentReason.value === 'not ready to tutor') {
    return `Finish the volunteer Onboarding and Safety Screening tasks on the dashboard to view your NTHS Chapter details`
  } else {
    return `Uh oh! It looks like you have indicated that you are not a high school student in your Background Information form. Unfortunately, National Tutoring Honors Society is only available to current high school students. You can keep volunteering with UPchieve, but you will be removed from ${group.value?.groupInfo?.name ?? 'this NTHS chapter'} automatically.`
  }
})

function goToDashboard() {
  router.push('/dashboard')
}

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
            </div>
          </template>
        </Callout>
      </div>
      <RouterView v-else />
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
}
.callout-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
  align-items: center;
  padding-bottom: 8px;
}
</style>
