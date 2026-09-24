<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import Callout from '@/components/Callout.vue'
import LargeButton from '@/components/LargeButton.vue'
import DoThisNextCard from '@/components/NTHS/HQ/DoThisNextCard.vue'
import HQSection from '@/components/NTHS/HQ/HQSection.vue'
import ImpactPanel from '@/components/NTHS/HQ/ImpactPanel.vue'
import InviteLink from '@/components/NTHS/InviteLink.vue'
import TopTutorCard from '@/components/NTHS/TopTutorCard.vue'
import { useChapterImpact } from '@/composables/useChapterImpact'
import { NTHS_RECRUITMENT_TEMPLATES_URL } from '@/services/NTHSGroupService'

const store = useStore()
const router = useRouter()

const group = computed(() => store.state.nths.NTHSGroups?.[0])
const groupId = computed(() => group.value?.groupInfo?.id)
const currentUserId = computed(() => store.state.user.user.id)
const isGroupAdmin = computed(() => store.getters['nths/hasAdminRole'])

const { impact, isLoading, loadFailed, load } = useChapterImpact()

const inviteSection = ref<HTMLElement>()

const now = new Date()

onBeforeMount(async () => {
  if (groupId.value) await load(groupId.value, now)
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
      <InviteLink :code="group.groupInfo.inviteCode">
        <a
          class="invite-scripts"
          :href="NTHS_RECRUITMENT_TEMPLATES_URL"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="invite-scripts"
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
    <ImpactPanel v-else :impact="isLoading ? undefined : impact" />

    <TopTutorCard
      v-if="impact"
      :topTutor="impact.topTutorThisMonth"
      :currentUserId="currentUserId"
      :viewerHoursThisMonth="impact.viewerHoursThisMonth"
    />

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
