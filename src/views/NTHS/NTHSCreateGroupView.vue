<script setup lang="ts">
import LargeButton from '@/components/LargeButton.vue'
import NetworkService from '@/services/NetworkService'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'
import LoggerService from '@/services/LoggerService'
import { isErrorWithResponse } from '@/utils/error-utils'
import { dayjs } from '@/utils/time-utils'
import { nthsDestination } from '@/views/NTHS/nths-route-helpers'
import NTHSPageLayout from '@/components/NTHS/NTHSPageLayout.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const store = useStore()
const router = useRouter()
const hasGroup = computed(() => store.state.nths.NTHSGroups.length)
const errorMessage = ref('')
const approvalDeadline = computed(() => {
  const expiresAt = store.state.nths.approvalExpiresAt
  return expiresAt ? dayjs(expiresAt).format('MMMM Do [at] h:mmA z') : null
})

watch(
  () => hasGroup.value,
  (len) => {
    if (len > 0) router.replace('/groups')
  }
)

async function createTeam() {
  try {
    errorMessage.value = ''
    const results = await NetworkService.createNTHSGroup()
    store.commit('nths/setNTHSGroups', [results.data.group])
    AnalyticsService.captureEvent(EVENTS.NTHS_CHAPTER_CREATED)
  } catch (e) {
    if (isErrorWithResponse(e)) {
      // The use shouldn't really be able to get to this
      // unless they have multiple tabs open. let's redirect them to their
      // group page right away if they are a member of a group
      if (e.response.data.err === 'User already in a group') {
        router.replace('/groups')
      } else if (e.response.status === 422) {
        // Besides an expired approval, 422 covers rule hits such as a school
        // already claimed, whose message is shown as is.
        if (nthsDestination(store) === 'expired') {
          router.replace('/groups/application-expired')
        } else {
          errorMessage.value = e.response.data.err
        }
      } else {
        errorMessage.value = `Unknown error, please try again: ${e.response.data.err}`
        LoggerService.noticeError(e.response.data.err)
      }
    } else {
      errorMessage.value = 'Unknown error, please try again'
      LoggerService.noticeError(e)
    }
  }
}
</script>

<template>
  <NTHSPageLayout>
    <form autocomplete="off" class="form" @submit.prevent="createTeam">
      <span>
        Create an NTHS chapter to help students across the U.S. get free,
        on-demand academic support!
      </span>
      <span v-if="approvalDeadline"
        >Deadline to create chapter: {{ approvalDeadline }}</span
      >
      <span class="error" v-if="errorMessage.length">{{ errorMessage }}</span>
      <div class="actions">
        <LargeButton variant="primary-blue" :show-arrow="false" type="submit"
          >Create NTHS Chapter</LargeButton
        >
      </div>
    </form>
  </NTHSPageLayout>
</template>

<style lang="scss" scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.actions {
  display: flex;
  justify-content: center;
}
.error {
  color: $c-error-red;
}
</style>
