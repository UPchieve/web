<script setup lang="ts">
import { computed } from 'vue'
import InitialsAvatar from '@/components/InitialsAvatar.vue'
import { avatarColor, AVATAR_TEXT_COLOR } from '@/components/NTHS/member-avatar'
import type { NTHSTopTutorPublic } from '@/services/NTHSGroupService'
import { memberDisplayName } from '@/services/NTHSRosterService'
import { topTutorDetail, viewerHoursLine } from '@/services/NTHSTopTutorService'

const props = defineProps<{
  topTutor?: NTHSTopTutorPublic
  currentUserId: string
  // Omitted on Members, where the card has no viewer to address.
  viewerHoursThisMonth?: number
}>()

const showYouLine = computed(
  () =>
    props.viewerHoursThisMonth !== undefined &&
    props.topTutor?.userId !== props.currentUserId
)
</script>

<template>
  <section class="top-tutor" data-testid="top-tutor">
    <InitialsAvatar
      v-if="topTutor"
      :initials="topTutor.firstName.charAt(0).toUpperCase()"
      :widthPx="40"
      :bgColor="avatarColor(topTutor.userId)"
      :fgColor="AVATAR_TEXT_COLOR"
    />
    <div class="top-tutor-text">
      <p class="top-tutor-eyebrow">Top tutor of the month</p>
      <template v-if="topTutor">
        <p class="top-tutor-name">
          {{ memberDisplayName(topTutor) }}
        </p>
        <p class="top-tutor-detail" data-testid="top-tutor-detail">
          {{ topTutorDetail(topTutor) }}
        </p>
      </template>
      <p v-else class="top-tutor-detail" data-testid="top-tutor-empty">
        No top tutor yet this month
      </p>
      <p v-if="showYouLine" class="top-tutor-you" data-testid="top-tutor-you">
        {{ viewerHoursLine(viewerHoursThisMonth!) }}
      </p>
    </div>
  </section>
</template>

<style scoped lang="scss">
.top-tutor {
  @include nths-card(18px 22px);
  background: $c-nths-cream;
  border-color: $c-college;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px;
}
.top-tutor-text {
  flex: 1;
  min-width: 160px;
}
.top-tutor-eyebrow {
  @include nths-card-eyebrow;
  color: $c-nths-gold-fg;
  margin: 0;
}
.top-tutor-name {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.3;
  margin: 5px 0 0;
}
.top-tutor-detail {
  font-size: 13px;
  line-height: 1.4;
  color: $c-nths-gold-fg;
  margin: 2px 0 0;
}
.top-tutor-you {
  font-size: 13px;
  line-height: 1.4;
  margin: 6px 0 0;
}
</style>
