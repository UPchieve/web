<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const props = defineProps<{
  userType: 'student' | 'volunteer'
  partnerPresence: string | null
  audioCallSupported: boolean
  partnerMicStatus: string
}>()

const sessionPartner = computed(() => store.getters['user/sessionPartner'])
</script>

<template>
  <div class="name-container">
    <div>
      <div class="name">{{ sessionPartner.firstname }}</div>
      <div class="status">
        {{ props.partnerPresence }}
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.name-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  color: white;
}
.disabled-mic {
  vertical-align: text-bottom;
  display: inline-flex;
}
.disabled-mic::before {
  border-radius: 3px;
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  padding-left: 8px;
  padding-right: 8px;
  left: 175%;
  top: 100%;
  transition-property: none;
  max-width: 130px;
}

.name {
  font-size: 18px;
  font-weight: 600;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
}
.status {
  font-size: 14px;
  font-weight: 400;
}
</style>
