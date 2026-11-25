<script lang="ts" setup>
import { computed } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import EditableName from '@/components/NTHS/EditableName.vue'
import HQSection from '@/components/NTHS/HQ/HQSection.vue'
import SchoolAffiliation from '@/components/NTHS/SchoolAffiliation.vue'
import { useNthsStore } from '@/stores/nths'

const emit = defineEmits<{ (e: 'leave'): void }>()

const nths = useNthsStore()
const group = computed(() => nths.NTHSGroups?.[0])
</script>

<template>
  <div v-if="group" class="setup">
    <hr class="divider" />
    <h2 class="section-title">Your chapter</h2>

    <HQSection>
      <h3 class="question">Chapter name</h3>
      <p class="help">The name shown on your chapter page and to members.</p>
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
        <p class="help">
          Leaving your chapter is permanent and removes your access to chapter
          tools and your members' data.
        </p>
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
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 700px) {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
