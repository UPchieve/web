<script setup lang="ts">
import LargeButton from '@/components/LargeButton.vue'
import NetworkService from '@/services/NetworkService'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { computed, ref, watch } from 'vue'
import LoggerService from '@/services/LoggerService'
import { isErrorWithResponse } from '@/utils/error-utils'

const store = useStore()
const router = useRouter()
const hasGroup = computed(() => store.state.nths.NTHSGroups.length)
const errorMessage = ref('')

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
  <div class="page">
    <div class="container">
      <form autocomplete="off" class="content" @submit.prevent="createTeam">
        <h1 class="title">National Tutoring Honors Society</h1>
        <span>
          Create an NTHS Chapter to help more under-resourced students get free,
          on-demand academic and college support
        </span>
        <span class="error" v-if="errorMessage.length">{{ errorMessage }}</span>
        <div class="actions">
          <LargeButton variant="primary-blue" :show-arrow="false" type="submit"
            >Create NTHS Chapter</LargeButton
          >
        </div>
      </form>
      <div class="footer">
        <img class="image" src="@/assets/nths/create-team.png" aria-hidden />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  font-weight: 500;
  @include breakpoint-below('medium') {
    font-size: 24px;
  }
}

.page {
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 32px;
}
.container {
  border-radius: 8px;
  width: 100%;
  background-color: #fff;
  overflow: hidden;
  box-shadow:
    3px 3px 3px $c-shadow-header,
    -3px 3px 3px $c-shadow-header;

  @include breakpoint-above('medium') {
    max-width: 600px;
  }
}
.content {
  padding: 32px;
  gap: 12px;
  display: flex;
  flex-direction: column;
}
.footer {
  display: flex;
  justify-content: center;
  background-color: $upchieve-green;
  background-color: color-mix(in oklab, $upchieve-green, white 70%);
  padding: 24px;
}
.actions {
  display: flex;
  justify-content: center;
}
.image {
  max-height: 233px;
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

.error {
  color: $c-error-red;
}
</style>
