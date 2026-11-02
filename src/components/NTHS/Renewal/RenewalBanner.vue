<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useStore } from 'vuex'
import Callout from '@/components/Callout.vue'
import LargeButton from '@/components/LargeButton.vue'
import ModalService from '@/services/ModalService'
import LoggerService from '@/services/LoggerService'
import { useRenewalNaming } from '@/composables/useRenewalNaming'
import {
  NEXT_PRESIDENT_UNNAMED_TITLE,
  acceptedPresidentsTitle,
  namedSuccessors,
  namedSuccessorsTitle,
  renewalCountdownTitle,
  renewalDate,
  renewalDaysLeft,
  renewalSchoolYear,
  successorPickerHint,
  whoWillLeadTitle,
} from '@/services/NTHSRenewalService'
import type {
  NTHSRenewalPrompt,
  NTHSRenewalPublic,
  NTHSRenewalSuccessorPublic,
} from '@/services/NTHSGroupService'

const props = defineProps<{ groupId: string }>()
const store = useStore()
const {
  renewal,
  chapterName,
  isSubmitting,
  errorMessage,
  nameSelf,
  accept,
  decline,
} = useRenewalNaming(
  () => props.groupId,
  () =>
    ModalService.showNthsAcceptPresidency({
      chapterName: chapterName.value,
      schoolYear:
        renewal.value?.prompt === 'step-up'
          ? undefined
          : renewalSchoolYear(renewal.value?.closesOn ?? null),
    })
)
const successorsFailed = ref(false)

const successors = computed<NTHSRenewalSuccessorPublic[]>(
  () => store.state.nths.NTHSRenewalSuccessors[props.groupId] ?? []
)

type Banner = {
  title: string
  body: string
  primaryLabel: string
  variant: 'information' | 'warning'
  onPrimary: () => unknown
  secondary?: { label: string; onClick: () => unknown }
}

const BANNERS: Partial<
  Record<NTHSRenewalPrompt, (renewal: NTHSRenewalPublic) => Banner>
> = {
  'name-successor-banner': (r) => ({
    title: whoWillLeadTitle(chapterName.value),
    body: `Name one or more members as next year's president. They'll be notified and can accept starting ${renewalDate(r.successorConfirmationOn)}.`,
    primaryLabel: 'Name president',
    variant: 'information',
    onPrimary: openPicker,
  }),
  'name-successor-reminder': (r) => ({
    title: NEXT_PRESIDENT_UNNAMED_TITLE,
    body: `Name one or more members by ${renewalDate(r.namingClosesOn)}. If nobody accepts by ${renewalDate(r.closesOn)}, the chapter closes.`,
    primaryLabel: 'Name president',
    variant: 'information',
    onPrimary: openPicker,
  }),
  'successors-named': (r) => ({
    title: successorsFailed.value
      ? "Next year's president"
      : namedSuccessorsTitle(successors.value, store.state.user.user.id),
    body: successorPickerHint(r),
    primaryLabel: 'Change',
    variant: 'information',
    onPrimary: openPicker,
  }),
  'co-president-offer': (r) => ({
    title: acceptedPresidentsTitle(
      r.acceptedPresidents,
      renewalSchoolYear(r.closesOn)
    ),
    body: `You were named too, so you can still join as co-president until ${renewalDate(r.closesOn)}.`,
    primaryLabel: 'Accept as co-president',
    variant: 'information',
    onPrimary: accept,
    secondary: { label: 'Step down', onClick: decline },
  }),
  'decliner-countdown': (r) => ({
    title: renewalCountdownTitle(
      chapterName.value,
      renewalDaysLeft(r.closesOn)
    ),
    body: `Nobody has accepted the presidency for ${renewalSchoolYear(r.closesOn)} yet. If nobody does by ${renewalDate(r.closesOn)}, the chapter closes. You can still step up.`,
    primaryLabel: 'Lead the chapter',
    variant: 'warning',
    onPrimary: accept,
  }),
  'step-up': () => ({
    title: `${chapterName.value} needs a president`,
    body: 'Nobody can manage your chapter right now. Step up as president to keep it going.',
    primaryLabel: 'Step up as president',
    variant: 'warning',
    onPrimary: accept,
  }),
}

const banner = computed(() => {
  const r = renewal.value
  if (!r) return
  return BANNERS[r.prompt]?.(r)
})

const successorsFetched = ref(false)

async function loadSuccessors() {
  try {
    await store.dispatch('nths/fetchNTHSRenewalSuccessors', props.groupId)
    successorsFailed.value = false
  } catch (err) {
    successorsFailed.value = true
    LoggerService.noticeError(err, 'Could not load NTHS successors')
  } finally {
    successorsFetched.value = true
  }
}

watch(
  renewal,
  (current) => {
    if (current?.prompt === 'successors-named') {
      void loadSuccessors()
    } else {
      successorsFetched.value = false
    }
  },
  { immediate: true }
)

const isReady = computed(
  () =>
    renewal.value?.prompt !== 'successors-named' ||
    (successorsFetched.value &&
      (successorsFailed.value || namedSuccessors(successors.value).length > 0))
)

function openPicker() {
  errorMessage.value = ''
  ModalService.showNthsSuccessorPicker({
    groupId: props.groupId,
    asReminder: false,
  })
}
</script>

<template>
  <div
    v-if="(banner && isReady) || errorMessage"
    class="renewal-banner"
    data-testid="renewal-banner"
  >
    <Callout v-if="banner && isReady" :variant="banner.variant">
      <template v-slot:content>
        <div class="banner-content">
          <div class="banner-text">
            <p class="banner-title">{{ banner.title }}</p>
            <p class="banner-body">{{ banner.body }}</p>
          </div>
          <div class="banner-actions">
            <LargeButton
              variant="primary-blue"
              :showArrow="false"
              data-testid="renewal-banner-primary"
              :disabled="isSubmitting"
              @click="banner.onPrimary()"
              >{{ banner.primaryLabel }}</LargeButton
            >
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
              v-if="renewal?.canNameSelf"
              variant="secondary"
              :showArrow="false"
              data-testid="renewal-banner-me"
              :disabled="isSubmitting"
              @click="nameSelf()"
              >Me</LargeButton
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
