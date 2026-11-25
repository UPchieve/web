<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useStore } from 'vuex'
import { RouterView, useRouter } from 'vue-router'
import { useDocumentVisibility } from '@vueuse/core'
import LargeButton from '@/components/LargeButton.vue'
import Callout from '@/components/Callout.vue'
import DocumentTitle from '@/components/DocumentTitle.vue'
import ChapterHeader from '@/components/NTHS/HQ/ChapterHeader.vue'
import RenewalBanner from '@/components/NTHS/Renewal/RenewalBanner.vue'
import LoggerService from '@/services/LoggerService'
import { useChapterContext } from '@/composables/useChapterContext'
import { provideChapterImpact } from '@/composables/useChapterImpact'
import { renewalWarningLine } from '@/services/NTHSRenewalService'
import {
  NTHS_TAB_LABELS,
  resolveNthsRoute,
} from '@/views/NTHS/nths-route-helpers'
import { useNthsStore } from '@/stores/nths'

const store = useStore()
const nths = useNthsStore()
const router = useRouter()
const {
  group,
  referralCode,
  leaveChapter: onLeaveChapter,
} = useChapterContext()
const isGroupAdmin = computed(() => nths.hasAdminRole)

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

const documentTitle = computed(() => {
  const tab = (NTHS_TAB_LABELS as Record<string, string>)[
    router.currentRoute.value.path
  ]
  return tab ? `${tab} | Chapter HQ` : 'Chapter HQ'
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
        router.currentRoute.value
      )
      if (redirect && !isUnmounted) {
        await router.replace(redirect)
      }
    }
  } catch (err) {
    LoggerService.noticeError(err, 'Could not refresh NTHS data')
  }
}

const { impact, load: loadImpact } = provideChapterImpact()

function loadHeaderImpact() {
  const groupId = group.value?.groupInfo?.id
  if (!groupId || hidePageContentReason.value) return
  void loadImpact(groupId)
}
watch(
  [() => group.value?.groupInfo?.id, hidePageContentReason],
  loadHeaderImpact,
  { immediate: true }
)

onMounted(() => {
  void refreshNTHSData()
})

watch(
  () => router.currentRoute.value.path,
  () => {
    void refreshNTHSData()
    loadHeaderImpact()
  }
)

// The renewal countdown reads today's date, which nothing reactive changes in
// a tab left open overnight.
watch(useDocumentVisibility(), (visibility) => {
  if (visibility === 'visible') {
    void refreshNTHSData()
  }
})
</script>

<template>
  <div class="chapter-hq">
    <DocumentTitle :title="documentTitle" />
    <ChapterHeader
      :name="group?.groupInfo?.name"
      :isGroupAdmin="isGroupAdmin"
      :gated="!!hidePageContentReason"
      :impact="impact"
      :inviteCode="group?.groupInfo?.inviteCode"
      :referralCode="referralCode"
    />

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
