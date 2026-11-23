<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import LargeButton from '@/components/LargeButton.vue'
import { useInviteLink } from '@/composables/useInviteLink'
import {
  NTHS_RECRUITMENT_TEMPLATES_URL,
  type NTHSChapterImpactPublic,
} from '@/services/NTHSGroupService'
import { nextStepFor } from '@/services/NTHSImpactService'
import { formatMinutes } from '@/services/NTHSTopMembersService'
import { plural } from '@/utils/plural'

const props = defineProps<{
  impact: NTHSChapterImpactPublic
  memberCount: number
  inviteCode?: string
  referralCode: string
}>()

const { justCopied, copyLink } = useInviteLink(
  () => props.inviteCode ?? '',
  () => props.referralCode
)

const step = computed(() => nextStepFor(props.impact, props.memberCount))

const line = computed(() => {
  if (!step.value) return ''
  const { kind, gap } = step.value
  if (kind === 'invite') {
    return props.memberCount <= 1
      ? 'Invite your first member'
      : `Invite ${gap} ${plural(gap, 'more member')}`
  }
  if (kind === 'first-session') {
    return `Get ${gap} ${plural(gap, 'more member')} to their first session`
  }
  return `Log ${formatMinutes(gap)} more to reach ${props.impact.goals.hoursTutored} hours`
})
</script>

<template>
  <Transition name="card" appear>
    <section
      v-if="step"
      class="right-now"
      aria-labelledby="right-now-title"
      data-testid="right-now"
    >
      <h2 id="right-now-title" class="eyebrow">Right now</h2>
      <p class="big" data-testid="right-now-line">{{ line }}</p>
      <div class="actions">
        <LargeButton
          v-if="inviteCode"
          variant="primary-blue"
          :showArrow="false"
          data-testid="right-now-copy"
          v-ph:nthshq="'home.invite.copy'"
          @click="copyLink"
        >
          <span aria-live="polite">
            {{ justCopied ? 'Copied' : 'Copy invite link' }}
          </span>
        </LargeButton>
        <LargeButton
          variant="secondary"
          :showArrow="false"
          :routeTo="NTHS_RECRUITMENT_TEMPLATES_URL"
          target="_blank"
          rel="noopener noreferrer"
          data-testid="right-now-scripts"
          v-ph:nthshq="'home.recruitment_templates'"
        >
          Recruiting scripts
        </LargeButton>
      </div>
      <RouterLink
        class="more"
        to="/groups/resources"
        v-ph:nthshq="'home.resources'"
      >
        More tips &amp; resources <span aria-hidden="true">→</span>
      </RouterLink>
    </section>
  </Transition>
</template>

<style scoped lang="scss">
.right-now {
  @include nths-card;
}
.eyebrow {
  @include nths-card-eyebrow;
  color: $c-nths-warm-fg;
  margin: 0;
}
.big {
  font-size: 22px;
  font-weight: 500;
  line-height: 1.3;
  margin: 10px 0 16px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 12px;
}
.more {
  display: inline-block;
  margin-top: 16px;
  font-size: 14px;
  color: $c-information-blue;
}
.card-enter-active,
.card-leave-active {
  transition: opacity 200ms ease;
}
.card-enter-from,
.card-leave-to {
  opacity: 0;
}
</style>
