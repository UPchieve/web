<script setup lang="ts">
import InviteLink from '@/components/NTHSGroup/InviteLink.vue'
import Spinner from '@/components/Spinner.vue'
import config from '@/config'
import { computed, ref } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const group = computed(() => store.state.volunteer.NTHSGroups?.[0])
const code = computed(() => group.value?.inviteCode)
const isLoaded = ref(false)
</script>

<template>
  <div class="container">
    <div class="header">
      <h2 v-if="group?.groupName">{{ group.groupName }}</h2>
      <InviteLink v-if="code" :code="code" />
    </div>
    <iframe
      v-if="Boolean(group?.groupId)"
      ref="iframe"
      class="iframe"
      :class="isLoaded ? '' : 'hide'"
      :src="`${config.NTHSRetoolDashboardUrl}?groupId=${group.groupId}`"
      width="100%"
      height="100%"
      loading="lazy"
      :onload="() => (isLoaded = true)"
    />
    <div class="spinner-container" v-if="!isLoaded">
      <Spinner />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.spinner-container {
  flex-grow: 1;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
}
.hide {
  width: 0;
  height: 0;
  opacity: 0;
}
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
}
.iframe {
  border: none;
}
.header {
  padding: 1em 1em 0 1em;
  display: flex;
  justify-content: space-between;
  width: 100%;
  @include breakpoint-below('large') {
    flex-direction: column;
  }
}
</style>
