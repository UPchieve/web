<script setup lang="ts">
import InitialsAvatar from '@/components/InitialsAvatar.vue'
import { avatarColor, AVATAR_TEXT_COLOR } from '@/components/NTHS/member-avatar'
import type { NTHSRosterMemberPublic } from '@/services/NTHSGroupService'
import {
  memberDisplayName,
  roleLabel,
  roleTagLabel,
} from '@/services/NTHSRosterService'

defineProps<{ member: NTHSRosterMemberPublic }>()
</script>

<template>
  <InitialsAvatar
    :initials="member.firstName.charAt(0).toUpperCase()"
    :widthPx="36"
    :bgColor="avatarColor(member.userId)"
    :fgColor="AVATAR_TEXT_COLOR"
  />
  <div class="member-text">
    <div class="member-name-row">
      <span class="member-name">{{ memberDisplayName(member) }}</span>
      <span
        v-if="roleTagLabel(member)"
        class="role-tag"
        :class="{ president: roleTagLabel(member) === 'President' }"
        >{{ roleTagLabel(member) }}</span
      >
    </div>
    <span class="member-role">{{ roleLabel(member) }}</span>
  </div>
</template>

<style scoped lang="scss">
.member-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.member-name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.member-name {
  font-size: 15px;
  font-weight: 500;
  color: $c-soft-black;
}
.role-tag {
  border-radius: 4px;
  padding: 3px 8px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.2;
  background: $c-nths-sky;
  color: $c-information-blue;
}
.role-tag.president {
  background: $c-nths-cream;
  color: $c-nths-gold-fg;
}
.member-role {
  font-size: 13px;
  color: $c-secondary-grey;
  margin-top: 2px;
}
</style>
