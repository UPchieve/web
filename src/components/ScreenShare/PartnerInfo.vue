<script lang="ts" setup>
import { computed } from 'vue'
import { useStore } from 'vuex'
import StarIcon from '@/assets/icons/star_icon.svg'

const store = useStore()
const props = defineProps<{
  partnerPresence: string | null
  isFavoriteVolunteer: boolean
}>()

const sessionPartner = computed(() => store.getters['user/sessionPartner'])
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

.star-icon {
  width: 20px;
  height: 20px;
}

:deep(.star-icon path) {
  fill: $c-success-green;
  stroke: $c-success-green;
}
</style>
