<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import Callout from '@/components/Callout.vue'
import ContributionCard from '@/components/NTHS/HQ/ContributionCard.vue'
import GoodStandingCard from '@/components/NTHS/HQ/GoodStandingCard.vue'
import ImpactCard from '@/components/NTHS/HQ/ImpactCard.vue'
import ResourceLinksCard from '@/components/NTHS/HQ/ResourceLinksCard.vue'
import RightNowCard from '@/components/NTHS/HQ/RightNowCard.vue'
import TipCard from '@/components/NTHS/HQ/TipCard.vue'
import TopMembersBoard from '@/components/NTHS/HQ/TopMembersBoard.vue'
import MembersTable from '@/components/NTHS/Members/MembersTable.vue'
import { useChapterContext } from '@/composables/useChapterContext'
import { useChapterImpact } from '@/composables/useChapterImpact'
import { useChapterRoster } from '@/composables/useChapterRoster'
import { getNTHSHomeContent } from '@/services/NetworkService'
import {
  tipForDay,
  type NTHSHomeContentResponse,
} from '@/services/NTHSGroupService'
import { useNthsStore } from '@/stores/nths'

const nths = useNthsStore()

const {
  group,
  groupId,
  currentUserId,
  referralCode: currentUserReferralCode,
} = useChapterContext()
const isGroupAdmin = computed(() => nths.hasAdminRole)

const { impact, isLoading, loadFailed, load } = useChapterImpact()
const {
  members,
  currentMembers,
  schoolYear,
  isLoading: isRosterLoading,
  loadFailed: rosterLoadFailed,
  load: loadRoster,
} = useChapterRoster()

const now = new Date()

const homeContent = ref<NTHSHomeContentResponse>()
const tip = computed(() =>
  homeContent.value ? tipForDay(homeContent.value.tips, now) : undefined
)
const resourceLinks = computed(() => homeContent.value?.links ?? [])

async function loadHomeContent(id: string) {
  homeContent.value = await getNTHSHomeContent(id).catch(() => undefined)
}

const membersTableProps = computed(() => ({
  members: currentMembers.value,
  currentUserId: currentUserId.value,
  isGroupAdmin: isGroupAdmin.value,
  inviteCode: group.value?.groupInfo?.inviteCode,
  referralCode: currentUserReferralCode.value,
  now,
  isLoading: isRosterLoading.value,
  loadFailed: rosterLoadFailed.value,
  schoolYearLabel: schoolYear.value?.label ?? '',
}))

onBeforeMount(async () => {
  if (groupId.value) {
    await Promise.all([
      load(groupId.value),
      loadRoster(groupId.value, now),
      loadHomeContent(groupId.value),
    ])
  }
})
</script>

<template>
  <div class="home">
    <h1 class="visually-hidden">Home</h1>

    <Callout v-if="loadFailed" variant="warning">
      <template v-slot:content>
        <span data-testid="impact-error">
          We couldn't load your chapter numbers. Refresh the page to try again.
        </span>
      </template>
    </Callout>
    <ImpactCard v-else :impact="isLoading ? undefined : impact" />

    <div v-if="isGroupAdmin" class="admin-grid" :class="{ single: loadFailed }">
      <div class="main-column">
        <RightNowCard
          v-if="impact && !isRosterLoading && !rosterLoadFailed"
          :impact="impact"
          :memberCount="currentMembers.length"
          :inviteCode="group?.groupInfo?.inviteCode"
          :referralCode="currentUserReferralCode"
        />
        <MembersTable v-bind="membersTableProps" />
      </div>
      <div v-if="!loadFailed" class="side-column">
        <TopMembersBoard
          :members="members"
          :currentUserId="currentUserId"
          :isLoading="isRosterLoading"
          :loadFailed="rosterLoadFailed"
        />
        <GoodStandingCard :impact="isLoading ? undefined : impact" />
        <TipCard v-if="tip" :tip="tip" />
        <ResourceLinksCard v-if="resourceLinks.length" :links="resourceLinks" />
      </div>
    </div>
    <template v-else>
      <div v-if="!loadFailed" class="impact-row">
        <ContributionCard
          :members="currentMembers"
          :currentUserId="currentUserId"
          :impact="isLoading ? undefined : impact"
          :isLoading="isRosterLoading"
          :loadFailed="rosterLoadFailed"
        />
        <TopMembersBoard
          :members="members"
          :currentUserId="currentUserId"
          :isLoading="isRosterLoading"
          :loadFailed="rosterLoadFailed"
        />
      </div>
      <MembersTable v-bind="membersTableProps" />
      <ResourceLinksCard v-if="resourceLinks.length" :links="resourceLinks" />
    </template>
  </div>
</template>

<style scoped lang="scss">
.home {
  @include nths-tab-column(1020px);
  gap: 26px;
}
.impact-row {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  align-items: start;
  gap: 20px;

  @include breakpoint-below('large') {
    grid-template-columns: 1fr;
  }
}
.admin-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  align-items: start;
  gap: 32px;

  @include breakpoint-below('large') {
    grid-template-columns: minmax(0, 1fr);
  }

  &.single {
    grid-template-columns: minmax(0, 1fr);
  }
}
.main-column {
  display: grid;
  gap: 26px;
  min-width: 0;
}
.side-column {
  display: grid;
  gap: 32px;
  min-width: 0;
}
</style>
