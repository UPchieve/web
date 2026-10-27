<script setup lang="ts">
import { useStore } from 'vuex'
import { computed } from 'vue'

const store = useStore()
const user = computed(() => store.state.user.user)
const mobileMode = computed(() => store.getters['app/mobileMode'])
const incentiveBannerPayload = computed(
  () => store.getters['featureFlags/getIncentiveBannerPayload']
)

const DEFAULT_INCENTIVE_BANNER_TEXT =
  'Students at your school can earn rewards for using UPchieve!'

const incentiveBannerText = computed(() => {
  if (
    !incentiveBannerPayload.value ||
    typeof incentiveBannerPayload.value !== 'string' ||
    !user.value.schoolName
  )
    return DEFAULT_INCENTIVE_BANNER_TEXT
  return incentiveBannerPayload.value.replaceAll(
    '{{schoolName}}',
    user.value.schoolName
  )
})
</script>

<template>
  <div class="header">
    <div class="header-message" :class="{ 'header-message-small': mobileMode }">
      <span>{{ incentiveBannerText }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.header {
  @include header-child;
  display: flex;
  align-items: center;
  background-color: $c-information-blue;

  &-message {
    margin: 0 auto;
    text-align: center;
    color: $upchieve-white;

    & span {
      font-weight: 500;
    }

    &-small {
      font-size: 14px;
    }
  }
}
</style>
