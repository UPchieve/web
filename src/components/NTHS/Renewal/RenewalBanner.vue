<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import { useRoute, useRouter } from 'vue-router'
import Callout from '@/components/Callout.vue'
import LargeButton from '@/components/LargeButton.vue'
import ModalService from '@/services/ModalService'
import { useRenewalAccept } from '@/composables/useRenewalAccept'
import {
  hasDismissedNTHSRenewalHandoff,
  setDismissedNTHSRenewalHandoff,
} from '@/services/BrowserStorageService'
import {
  renewalCountdownTitle,
  renewalDate,
  renewalDaysLeft,
  renewalSchoolYear,
  renewalStartYear,
} from '@/services/NTHSRenewalService'
import type {
  NTHSRenewalPrompt,
  NTHSRenewalPublic,
} from '@/services/NTHSGroupService'

const props = defineProps<{ groupId: string }>()
const router = useRouter()
const route = useRoute()
const store = useStore()
const { renewal, chapterName, isSubmitting, errorMessage, accept } =
  useRenewalAccept(
    () => props.groupId,
    () =>
      ModalService.showNthsAcceptPresidency({
        chapterName: chapterName.value,
        schoolYear:
          renewal.value?.prompt === 'step-up' ? undefined : schoolYear.value,
        confirmReturn: renewal.value?.prompt === 'confirm-return',
      })
  )

const schoolYear = computed(() =>
  renewalSchoolYear(renewal.value?.closesOn ?? null)
)

const handoffYear = computed(() =>
  renewalStartYear(renewal.value?.closesOn ?? null)
)

const handoffDismissed = ref(false)
watch(
  [() => props.groupId, handoffYear],
  ([groupId, year]) => {
    handoffDismissed.value = hasDismissedNTHSRenewalHandoff(
      store.state.user.user.id,
      groupId,
      year
    )
  },
  { immediate: true }
)

function dismissHandoff() {
  handoffDismissed.value = true
  setDismissedNTHSRenewalHandoff(
    store.state.user.user.id,
    props.groupId,
    handoffYear.value
  )
}

function goToMembers() {
  void router.push('/groups/members')
}

type Banner = {
  title: string
  body: string
  primaryLabel: string
  variant: 'information' | 'warning'
  onPrimary: () => unknown
  secondary?: { label: string; onClick: () => unknown }
}

const BANNERS: Partial<
  Record<NTHSRenewalPrompt, (renewal: NTHSRenewalPublic) => Banner | undefined>
> = {
  'handoff-banner': () =>
    handoffDismissed.value
      ? undefined
      : {
          title: `Get your chapter ready for ${schoolYear.value}`,
          body: `Time to set up your ${schoolYear.value} leaders! Make them admins and update their titles, especially the incoming President.`,
          primaryLabel: 'Go to Members',
          variant: 'information',
          onPrimary: goToMembers,
          secondary: { label: 'Dismiss', onClick: dismissHandoff },
        },
  'confirm-return': (r) => ({
    title: `Confirm your chapter is continuing in ${schoolYear.value}`,
    body: `Welcome back for a new school year! ✨ Make sure you've updated titles and admin roles on the Members tab, then confirm your chapter is still active by ${renewalDate(r.closesOn)}.`,
    primaryLabel: 'Confirm',
    variant: 'information',
    onPrimary: accept,
    secondary: { label: 'Go to Members', onClick: goToMembers },
  }),
  'confirm-reminder': (r) => ({
    title: `Action required by ${renewalDate(r.closesOn)}: choose a president 🚨`,
    body: `Make sure your chapter has chosen a president and updated their title on the Members tab, so they can confirm. If your president doesn't confirm by ${renewalDate(r.closesOn)}, the chapter will close.`,
    primaryLabel: 'Go to Members',
    variant: 'information',
    onPrimary: goToMembers,
  }),
  'member-countdown': (r) => ({
    title: renewalCountdownTitle(renewalDaysLeft(r.closesOn)),
    body: `No one has stepped up to lead in ${schoolYear.value} yet. Leading a chapter is a big deal. Takes about 1-2 hours of work a week, looks great for college apps, and you'll get a lot of support from UPchieve! If no one steps up to lead by ${renewalDate(r.closesOn)}, the chapter will close.`,
    primaryLabel: 'Lead the chapter',
    variant: 'warning',
    onPrimary: accept,
  }),
  'step-up': () => ({
    title: 'Your chapter needs a president',
    body: 'No one can manage your chapter right now. Step up as president to keep it going.',
    primaryLabel: 'Step up as president',
    variant: 'warning',
    onPrimary: accept,
  }),
}

const HOME_ONLY_PROMPTS: NTHSRenewalPrompt[] = [
  'handoff-banner',
  'confirm-return',
  'confirm-reminder',
]

const banner = computed(() => {
  const r = renewal.value
  if (!r) return
  if (HOME_ONLY_PROMPTS.includes(r.prompt) && route.path !== '/groups/home')
    return
  return BANNERS[r.prompt]?.(r)
})
</script>

<template>
  <div v-if="banner || errorMessage" class="renewal-banner">
    <Callout
      v-if="banner"
      :variant="banner.variant"
      data-testid="renewal-banner"
    >
      <template v-slot:content>
        <div class="banner-content">
          <div class="banner-text">
            <p class="banner-title">{{ banner.title }}</p>
            <p class="banner-body">{{ banner.body }}</p>
          </div>
          <div class="banner-actions">
            <LargeButton
              v-if="banner.secondary"
              variant="secondary"
              :showArrow="false"
              data-testid="renewal-banner-secondary"
              :disabled="isSubmitting"
              @click="banner.secondary.onClick()"
              >{{ banner.secondary.label }}</LargeButton
            >
            <LargeButton
              variant="primary-blue"
              :showArrow="false"
              data-testid="renewal-banner-primary"
              :disabled="isSubmitting"
              @click="banner.onPrimary()"
              >{{ banner.primaryLabel }}</LargeButton
            >
          </div>
        </div>
      </template>
    </Callout>
    <p
      v-if="errorMessage"
      class="banner-error"
      role="alert"
      data-testid="renewal-banner-error"
    >
      {{ errorMessage }}
    </p>
  </div>
</template>

<style lang="scss" scoped>
.renewal-banner {
  margin-bottom: 20px;
}
.banner-content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 8px 0;
}
.banner-text {
  flex: 1 1 320px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.banner-title {
  @include nths-card-title;
  margin: 0;
}
.banner-body {
  @include nths-page-subtitle;
  margin: 0;
}
.banner-error {
  @include nths-error-box;
  margin: 8px 0 0;
}
.banner-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
