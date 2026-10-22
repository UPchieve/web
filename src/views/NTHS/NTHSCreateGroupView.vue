<script setup lang="ts">
import LargeButton from '@/components/LargeButton.vue'
import NetworkService from '@/services/NetworkService'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'
import LoggerService from '@/services/LoggerService'
import { isErrorWithResponse } from '@/utils/error-utils'
import { dayjs } from '@/utils/time-utils'
import NTHSPageLayout from '@/components/NTHS/NTHSPageLayout.vue'

const store = useStore()
const router = useRouter()
const hasGroup = computed(() => store.state.nths.NTHSGroups.length)
const errorMessage = ref('')
const approvalDeadline = computed(() => {
  const expiresAt = store.state.nths.approvalExpiresAt
  return expiresAt ? dayjs(expiresAt).format('MMMM D [at] h A') : null
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
  } catch (e) {
    if (isErrorWithResponse(e)) {
      // The use shouldn't really be able to get to this
      // unless they have multiple tabs open. let's redirect them to their
      // group page right away if they are a member of a group
      if (e.response.data.err === 'User already in a group') {
        router.replace('/groups')
      } else if (e.response.status === 422) {
        // A 422 here is a rule the applicant has run into rather than a fault:
        // most often another chapter already covers their school, which staff
        // resolve by handing over that chapter's invite code. The server's
        // message is already the one to show them.
        errorMessage.value = e.response.data.err
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
        Create an NTHS Chapter to help more under-resourced students get free,
        on-demand academic and college support
      </span>
      <span v-if="approvalDeadline"
        >You have until {{ approvalDeadline }} to start your chapter.</span
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
