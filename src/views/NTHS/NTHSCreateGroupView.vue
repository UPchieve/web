<script setup lang="ts">
import LargeButton from '@/components/LargeButton.vue'
import NetworkService from '@/services/NetworkService'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import LoggerService from '@/services/LoggerService'
import { isErrorWithResponse } from '@/utils/error-utils'
import { useNthsStore } from '@/stores/nths'
import { nthsDestination } from '@/views/NTHS/nths-route-helpers'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import nthsLogo from '@/assets/nths/nths-logo.svg?url'
import { useCelebrationsStore } from '@/stores/celebrations'

const store = useStore()
const nths = useNthsStore()
const router = useRouter()
const celebrations = useCelebrationsStore()
const hasGroup = computed(() => nths.NTHSGroups.length)
const errorMessage = ref('')
const schoolName = store.state.user?.user?.schoolName?.trim()
const chapterName = ref(schoolName ? `NTHS of ${schoolName}`.slice(0, 64) : '')
const nameInput = ref<HTMLInputElement | null>(null)
const creating = ref(false)
const transitioning = ref(false)
const progress = ref(0)
let progressTimer: ReturnType<typeof setInterval> | undefined
let holdTimer: ReturnType<typeof setTimeout> | undefined
let unmounted = false

onBeforeUnmount(() => {
  unmounted = true
  clearInterval(progressTimer)
  clearTimeout(holdTimer)
})

function clearName() {
  chapterName.value = ''
  errorMessage.value = ''
  nameInput.value?.focus()
}

watch(
  () => hasGroup.value,
  (len) => {
    if (len > 0) router.replace('/groups')
  }
)

async function createTeam() {
  const name = chapterName.value.trim()
  if (!name || creating.value) return
  creating.value = true
  try {
    errorMessage.value = ''
    const result = await NetworkService.createNTHSGroup(name)
    if (!result.data.group?.groupInfo?.id) {
      throw new Error('Chapter creation response is missing a chapter ID')
    }
    AnalyticsService.captureEvent(EVENTS.NTHS_CHAPTER_CREATED)
    if (unmounted) return
    transitioning.value = true
    progress.value = 0
    progressTimer = setInterval(() => {
      progress.value = Math.min(progress.value + 1, 100)
      if (progress.value === 100) clearInterval(progressTimer)
    }, 20)
    const transitionFinished = new Promise<void>((resolve) => {
      holdTimer = setTimeout(resolve, 2500)
    })
    celebrations.celebrate()
    await transitionFinished
    if (!unmounted) nths.setNTHSGroups([result.data.group])
  } catch (e) {
    clearInterval(progressTimer)
    clearTimeout(holdTimer)
    creating.value = false
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
  <div v-if="transitioning" class="building" role="status" aria-live="polite">
    <div
      class="progress-track"
      role="progressbar"
      aria-label="Building your chapter experience"
      :aria-valuenow="progress"
      aria-valuemin="0"
      aria-valuemax="100"
    >
      <div class="progress-fill" :style="{ width: `${progress}%` }" />
    </div>
    <h1>Building your chapter experience</h1>
  </div>
  <div v-else class="page">
    <form autocomplete="off" class="form" @submit.prevent="createTeam">
      <img class="logo" :src="nthsLogo" alt="National Tutoring Honor Society" />
      <h1>Welcome to NTHS!</h1>
      <p>
        Name your chapter to get started.
        <template v-if="schoolName"
          >We picked one for you, and you can</template
        >
        <template v-else>You can</template> change it any time.
      </p>
      <label for="chapter-name">Chapter name</label>
      <div class="input-wrap">
        <input
          id="chapter-name"
          ref="nameInput"
          v-model="chapterName"
          type="text"
          autocomplete="off"
          maxlength="64"
          placeholder="NTHS at High school"
          :disabled="creating"
          :aria-invalid="!!errorMessage"
          :aria-describedby="errorMessage ? 'chapter-name-error' : undefined"
          @input="errorMessage = ''"
        />
        <button
          v-if="chapterName && !creating"
          class="clear"
          type="button"
          aria-label="Clear chapter name"
          @click="clearName"
        >
          ×
        </button>
      </div>
      <span
        id="chapter-name-error"
        class="error"
        v-if="errorMessage.length"
        role="alert"
        >{{ errorMessage }}</span
      >
      <div class="actions">
        <LargeButton
          variant="primary-blue"
          :show-arrow="false"
          type="submit"
          :disabled="!chapterName.trim() || creating"
          :aria-busy="creating"
          ><span v-if="creating" class="button-loading"
            ><span class="spinner" aria-hidden="true" />Creating chapter…</span
          ><template v-else>Start chapter</template></LargeButton
        >
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.building {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 24px;
  padding: 24px;
  background: white;
  text-align: center;
}
.progress-track {
  width: min(50%, 600px);
  height: 8px;
  border-radius: 8px;
  background: #e3f8f2;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #16d2aa;
}
.page {
  display: flex;
  justify-content: center;
  min-height: 100%;
  padding: 24px 24px 80px;
  background-color: #eef4f2;
  background-image: radial-gradient(#dce7e4 0.8px, transparent 0.8px);
  background-size: 15px 15px;
}
.form {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 366px;
  text-align: center;
}
.logo {
  width: 190px;
  align-self: center;
  margin-bottom: 22px;
}
h1 {
  font-size: 26px;
  line-height: 1.2;
  font-weight: 500;
  margin: 0;
}
p {
  @include nths-page-subtitle;
  margin: 14px auto 0;
  max-width: 380px;
}
label {
  text-align: left;
  margin: 30px 0 6px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.input-wrap {
  position: relative;
}
input {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid $border-grey;
  border-radius: 13px;
  padding: 12px 42px 12px 14px;
  font: inherit;
}
.clear {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  border: 0;
  background: #eef1f5;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  color: $c-secondary-grey;
  font-size: 20px;
  cursor: pointer;
}
.actions {
  display: flex;
  margin-top: 12px;
}
.actions :deep(button) {
  width: 100%;
  border-radius: 13px;
}
.button-loading {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .spinner {
    animation: none;
  }
}
.error {
  color: $c-error-red;
  text-align: left;
  margin-top: 8px;
}
</style>
