<script lang="ts" setup>
import { computed } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import EditableName from '@/components/NTHS/EditableName.vue'
import HQSection from '@/components/NTHS/HQ/HQSection.vue'
import SchoolAffiliation from '@/components/NTHS/SchoolAffiliation.vue'
import type { AffiliationStatus } from '@/services/NTHSGroupService'
import { useNthsStore } from '@/stores/nths'

const emit = defineEmits<{ (e: 'leave'): void }>()

const nths = useNthsStore()
const group = computed(() => nths.NTHSGroups?.[0])

const SCHOOL_PATH_STATUSES: AffiliationStatus[] = [
  'PENDING_SCHOOL_AFFILIATION',
  'PENDING_UPCHIEVE_VERIFICATION',
  'AFFILIATED',
]
const nameHelp = computed(() =>
  SCHOOL_PATH_STATUSES.includes(group.value?.schoolAffiliationStatus)
    ? 'School chapters use "NTHS at [School]." Write out the school\'s full name.'
    : 'Community chapters pick their own name, then add "a chapter of NTHS" — like "Bay Area Tutors: a chapter of NTHS."'
)
</script>

<template>
  <div v-if="group" class="setup">
    <hr class="divider" />
    <h2 class="section-title">Your chapter</h2>

    <HQSection>
      <h3 class="question">Chapter name</h3>
      <p class="help">{{ nameHelp }}</p>
      <EditableName
        class="name-editor"
        :groupName="group.groupInfo?.name"
        :groupId="group.groupInfo.id"
      />
    </HQSection>

    <SchoolAffiliation
      v-if="group.groupId"
      :groupId="group.groupId"
      :initialStatus="group.schoolAffiliationStatus"
      :hasSchoolOnRecord="!!group.hasSchoolOnRecord"
    />

    <HQSection class="leave">
      <div>
        <h3 class="question">Leave chapter</h3>
        <p class="help">Leaving removes your access to Chapter HQ.</p>
      </div>
      <LargeButton
        variant="danger"
        reverse
        :showArrow="false"
        data-testid="leave-team-button"
        v-ph:nthshq="'setup.leave_team'"
        @click="emit('leave')"
        >Leave chapter</LargeButton
      >
    </HQSection>
  </div>
</template>

<style lang="scss" scoped>
.setup {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.divider {
  width: 100%;
  margin: 8px 0 0;
  border: 0;
  border-top: 1px solid $c-border-grey;
}
.section-title {
  @include nths-page-title;
}
.question {
  @include nths-card-title;
  margin: 0;
}
.help {
  @include nths-page-subtitle;
  margin-top: 4px;
}
.name-editor {
  margin-top: 14px;
}
.leave {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}
</style>
