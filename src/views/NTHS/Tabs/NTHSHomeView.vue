<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import Callout from '@/components/Callout.vue'
import LargeButton from '@/components/LargeButton.vue'
import ContributionCard from '@/components/NTHS/HQ/ContributionCard.vue'
import DoThisNextCard from '@/components/NTHS/HQ/DoThisNextCard.vue'
import GoodStandingCard from '@/components/NTHS/HQ/GoodStandingCard.vue'
import HQSection from '@/components/NTHS/HQ/HQSection.vue'
import ImpactCard from '@/components/NTHS/HQ/ImpactCard.vue'
import TopMembersBoard from '@/components/NTHS/HQ/TopMembersBoard.vue'
import InviteLink from '@/components/NTHS/InviteLink.vue'
import { useChapterImpact } from '@/composables/useChapterImpact'
import { useChapterRoster } from '@/composables/useChapterRoster'
import { NTHS_RECRUITMENT_TEMPLATES_URL } from '@/services/NTHSGroupService'
import { useNthsStore } from '@/stores/nths'

const store = useStore()
const nths = useNthsStore()
const router = useRouter()

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
  isLoading: isRosterLoading,
  loadFailed: rosterLoadFailed,
  load: loadRoster,
} = useChapterRoster()

const inviteSection = ref<HTMLElement>()

const now = new Date()

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
    <template v-else>
      <ImpactCard :impact="isLoading ? undefined : impact" />
      <div class="impact-row" :class="{ 'impact-row-member': !isGroupAdmin }">
        <GoodStandingCard
          v-if="isGroupAdmin"
          :impact="isLoading ? undefined : impact"
        />
        <ContributionCard
          v-else
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
    </template>

    <HQSection
      v-if="isGroupAdmin"
      class="members"
      eyebrow="Your members"
      muted
      data-testid="home-members"
    >
      <h2 class="members-title">Track your members' progress</h2>
      <p class="members-line">
        See who's finished training, who's tutored, and who hasn't started yet.
      </p>
      <LargeButton
        class="members-button"
        variant="secondary"
        :showArrow="false"
        v-ph:nthshq="'home.view_members'"
        @click="router.push('/groups/members')"
      >
        See all members
      </LargeButton>
    </HQSection>
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
  align-items: start;
  gap: 20px;

  @include breakpoint-below('large') {
    grid-template-columns: 1fr;
  }
}
.impact-row-member {
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);

  @include breakpoint-below('large') {
    grid-template-columns: 1fr;
  }
}
.members {
  padding: 24px 26px;
}
.members-title {
  font-size: 18px;
  font-weight: 500;
  line-height: 1.35;
  margin-top: 12px;
}
.members-line {
  @include nths-page-subtitle;
  line-height: 1.6;
  margin-top: 8px;
}
.members-button {
  margin-top: 18px;
}
</style>
