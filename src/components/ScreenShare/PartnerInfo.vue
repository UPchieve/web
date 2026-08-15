<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import StarIcon from '@/assets/icons/star_icon.svg'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

const store = useStore()
const props = defineProps<{
  partnerPresence: string | null
  isFavoriteVolunteer: boolean
}>()

const sessionPartner = computed(() => store.getters['user/sessionPartner'])

const isShowInfoOptInEnabled = computed(
  () => store.getters['featureFlags/isShowInfoOptInEnabled']
)

const sharedInfoMessage = computed(() =>
  isShowInfoOptInEnabled.value
    ? store.state.session.partnerSharedInfoMessage
    : ''
)

const showSharedInfo = ref(false)
function toggleSharedInfo() {
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_LEARN_MORE_ABOUT_COACH)
  showSharedInfo.value = !showSharedInfo.value
}
</script>

<template>
  <div class="name-container">
    <div>
      <div class="name">
        {{ sessionPartner.firstname }}
        <StarIcon class="star-icon" v-if="props.isFavoriteVolunteer" />
      </div>
      <div class="status">
        {{ props.partnerPresence }}
      </div>
      <button
        v-if="sharedInfoMessage"
        type="button"
        class="shared-info-toggle"
        @click="toggleSharedInfo"
      >
        {{ showSharedInfo ? 'Hide' : 'Learn more about your coach' }}
      </button>
      <div v-if="showSharedInfo && sharedInfoMessage" class="shared-info">
        {{ sharedInfoMessage }}
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
  line-height: 18px;
}
.status {
  font-size: 12px;
  font-weight: 400;
}

.shared-info-toggle {
  background: none;
  border: none;
  padding: 0;
  color: white;
  font-size: 12px;
  font-weight: 400;
  text-decoration: underline;
  cursor: pointer;
  display: block;
}

.shared-info {
  font-size: 12px;
  font-weight: 400;
  margin-top: 4px;
}

.star-icon {
  width: 20px;
  height: 20px;
}

:deep(.star-icon path) {
  fill: $c-success-green;
  stroke: $c-success-green;
}
</style>
