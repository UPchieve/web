<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import Callout from '@/components/Callout.vue'
import ContributionCard from '@/components/NTHS/HQ/ContributionCard.vue'
import DoThisNextCard from '@/components/NTHS/HQ/DoThisNextCard.vue'
import GoodStandingCard from '@/components/NTHS/HQ/GoodStandingCard.vue'
import ImpactCard from '@/components/NTHS/HQ/ImpactCard.vue'
import TopMembersBoard from '@/components/NTHS/HQ/TopMembersBoard.vue'
import InviteLink from '@/components/NTHS/InviteLink.vue'
import MembersTable from '@/components/NTHS/Members/MembersTable.vue'
import { useChapterImpact } from '@/composables/useChapterImpact'
import { useChapterRoster } from '@/composables/useChapterRoster'
import { NTHS_RECRUITMENT_TEMPLATES_URL } from '@/services/NTHSGroupService'
import { useNthsStore } from '@/stores/nths'

const store = useStore()
const nths = useNthsStore()

const group = computed(() => nths.NTHSGroups?.[0])
const groupId = computed(() => group.value?.groupInfo?.id)
const currentUserId = computed(() => store.state.user.user.id)
const currentUserReferralCode = computed(
  () => store.state.user.user.referralCode
)
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

const inviteSection = ref<HTMLElement>()

const now = new Date()

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
    await Promise.all([load(groupId.value), loadRoster(groupId.value, now)])
  }
})
</script>

<template>
  <div class="home">
    <h1 class="visually-hidden">Home</h1>

    <DoThisNextCard
      v-if="isGroupAdmin && groupId"
      :groupId="groupId"
      @finished="inviteSection?.focus()"
    />

    <section
      v-if="group?.groupInfo?.inviteCode"
      ref="inviteSection"
      class="invite"
      tabindex="-1"
      aria-labelledby="invite-eyebrow"
      data-testid="invite"
    >
      <span id="invite-eyebrow" class="invite-eyebrow">Invite members</span>
      <p class="invite-line">Anyone with this link joins your chapter</p>
      <InviteLink
        :code="group.groupInfo.inviteCode"
        :referralCode="currentUserReferralCode"
      >
        <a
          class="invite-scripts"
          :href="NTHS_RECRUITMENT_TEMPLATES_URL"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="invite-scripts"
          v-ph:nthshq="'home.recruitment_templates'"
        >
          Invite scripts
        </a>
      </InviteLink>
    </section>

    <Callout v-if="loadFailed" variant="warning">
      <template v-slot:content>
        <span data-testid="impact-error">
          We couldn't load your chapter numbers. Refresh the page to try again.
        </span>
      </template>
    </Callout>
    <ImpactCard v-else :impact="isLoading ? undefined : impact" />

    <div v-if="isGroupAdmin" class="admin-grid" :class="{ single: loadFailed }">
      <MembersTable v-bind="membersTableProps" />
      <div v-if="!loadFailed" class="side-column">
        <TopMembersBoard
          :members="members"
          :currentUserId="currentUserId"
          :isLoading="isRosterLoading"
          :loadFailed="rosterLoadFailed"
        />
        <GoodStandingCard :impact="isLoading ? undefined : impact" />
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
    </template>
  </div>
</template>

<style scoped lang="scss">
.home {
  @include nths-tab-column(1020px);
  gap: 26px;
}
.visually-hidden {
  @include visually-hidden;
}
.invite {
  @include nths-card;
  background: $c-nths-sky;
}
.invite-eyebrow {
  @include nths-card-eyebrow;
  color: $c-information-blue;
}
.invite-scripts {
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.2;
  padding: 2px 0;
  color: $c-information-blue;
}
.invite-line {
  font-size: 20px;
  font-weight: 500;
  line-height: 1.35;
  margin: 10px 0 14px;
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
.side-column {
  display: grid;
  gap: 32px;
  min-width: 0;
}
</style>
