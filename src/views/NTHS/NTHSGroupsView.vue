<script setup lang="ts">
import InviteLink from '@/components/NTHS/InviteLink.vue'
import { computed, onBeforeMount } from 'vue'
import { useStore } from 'vuex'
import Checklist from '@/components/NTHS/Checklist.vue'
import { RouterLink, RouterView } from 'vue-router'
import LargeButton from '@/components/LargeButton.vue'

const store = useStore()
const group = computed(() => store.state.volunteer.NTHSGroups?.[0])
const code = computed(() => group.value?.groupInfo?.inviteCode)
const isGroupAdmin = computed(
  () => group.value?.memberInfo?.roleName === 'admin'
)
const groupActions = computed(() => store.state.volunteer.NTHSGroupActions)
const actions = computed(() => store.state.volunteer.NTHSActions ?? [])
const checklist = computed(() => store.getters['volunteer/NTHSChecklist'])

onBeforeMount(async () => {
  await store.dispatch(
    'volunteer/fetchNTHSGroupActions',
    group.value.groupInfo.id
  )
})
</script>

<template>
  <div class="container">
    <div class="header shrink center">
      <div class="header-main-info">
        <span class="name">{{ group.groupInfo?.name }}</span>
      </div>
      <div class="link">
        <InviteLink v-if="code" :code="code" />
      </div>
    </div>
    <div class="actions row shrink center">
      <Checklist
        v-if="isGroupAdmin && checklist.length"
        :groupId="group.groupInfo.id"
        :actions="actions"
        :groupActions="groupActions"
        :checklist="checklist"
      />
      <LargeButton
        v-if="isGroupAdmin"
        target="_blank"
        rel="noopener noreferrer"
        routeTo="https://drive.google.com/drive/folders/1ci0PfM_miToxUF1WNzmWK4r-EiJ8juCI?usp=sharing"
        >Review NTHS Resources
      </LargeButton>
    </div>
    <nav class="tabs shrink center">
      <RouterLink class="tab" activeClass="active" to="/groups/dashboard">
        Dashboard
      </RouterLink>
      <RouterLink
        v-if="isGroupAdmin"
        activeClass="active"
        class="tab"
        to="/groups/manage-team"
      >
        Manage Team
      </RouterLink>
      <RouterLink class="tab" activeClass="active" to="/groups/settings">
        Settings
      </RouterLink>
    </nav>
    <div class="grow tab-content center">
      <RouterView />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  --spacing: 1em;
  width: 100%;
  height: 100%;
  margin: auto;
  display: flex;
  flex-direction: column;
  justify-content: start;
  align-items: start;
  gap: var(--spacing);
  overflow: auto;
}
.center {
  max-width: 1200px;
  margin: auto;
}
.tabs {
  flex-shrink: 1;
  width: 100%;
  z-index: 1;
  border-bottom: 4px solid $border-grey;
  gap: 1em;
  display: flex;
  padding-left: var(--spacing);
  padding-right: var(--spacing);
}
.tab {
  display: inline-block;
  padding-bottom: 0.8em;
  margin-bottom: -4px;
  color: black;
}
.tab-content {
  width: 100%;
  padding: var(--spacing);
}
.active {
  font-weight: 500;
  border-bottom: 4px solid $c-success-green;
}

.spinner-container {
  flex-grow: 1;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
}

.row {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: start;
  padding: 24px;
}

.actions {
  flex-wrap: wrap-reverse;
  gap: 24px;
}

.check-list-container {
  display: grid;
  gap: 8px;
}
.header {
  width: 100%;
  padding: 1em 1em 0 1em;
  gap: 24px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
}
.header-main-info {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
  align-items: center;
}
.link {
  flex-grow: 1;
}
.team-action-button {
  margin-left: auto;
}
.buttons {
  display: flex;
  justify-content: end;
  gap: 12px;
}

.grow {
  flex-grow: 1;
}
.shrink {
  flex-shrink: 1;
}
.name {
  font-size: 24px;
  font-weight: 800;
  padding: 0 0 0 4px;
  margin-right: 8px;
}
</style>
