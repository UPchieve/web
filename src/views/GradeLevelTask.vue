<script lang="ts" setup>
import { EVENTS } from '@/consts'
import HyperlinkButton from '@/components/HyperlinkButton.vue'
import { onMounted, ref } from 'vue'
import { getAcademicYear } from '@/utils/academic-year'
import LoggerService from '@/services/LoggerService'
import UserService from '@/services/UserService'
import { useStore } from 'vuex'
import Loader from '@/components/Loader.vue'
import AnalyticsService from '@/services/AnalyticsService'
import CrossIcon from '@/assets/cross.svg'
import GradeLevelSelect from '@/components/GradeLevelSelect.vue'

const store = useStore()
const isSaving = ref<boolean>(false)
const isError = ref<boolean>(false)
const updated = ref<boolean>(false)

onMounted(() => {
  AnalyticsService.captureEvent(EVENTS.SAW_GRADE_LEVEL_DASHBOARD_TASK, {
    userType: store.getters['user/userType'],
  })
})

async function saveGradeLevel() {
  try {
    isError.value = false
    isSaving.value = true
    await UserService.setProfile(
      {
        gradeLevel: selectedGradeLevel.value,
      },
      store
    )
    AnalyticsService.captureEvent(EVENTS.UPDATED_GRADE_LEVEL, {
      userType: store.getters['user/userType'],
      gradeLevel: selectedGradeLevel.value,
    })
    updated.value = true
    await store.dispatch('user/addToUser', {
      gradeLevel: selectedGradeLevel.value,
    })
  } catch (err) {
    LoggerService.noticeError(err, 'Failed to update user grade level')
    isError.value = true
  } finally {
    isSaving.value = false
  }
}

const selectedGradeLevel = ref<string>('')
const emit = defineEmits(['dismissed'])
</script>

<template>
  <div class="grade-level-container">
    <div class="header">
      <div class="headings">
        <h1>
          Confirm your grade level for the
          {{ getAcademicYear().asString }} academic year
        </h1>
        <h2 v-if="!updated">
          This helps us tailor your UPchieve experience to you
        </h2>
        <h2 v-else class="success">Your information has been saved!</h2>
      </div>
      <button
        class="dismiss-button"
        type="button"
        @click="() => emit('dismissed')"
      >
        <CrossIcon class="cross-icon" />
      </button>
    </div>
    <form
      @submit.prevent="saveGradeLevel"
      class="grade-level-form"
      v-if="!updated"
      autocomplete="off"
    >
      <GradeLevelSelect v-model="selectedGradeLevel" />
      <HyperlinkButton
        v-if="!isSaving"
        :disabled="!selectedGradeLevel"
        class="save-button"
        buttonType="submit"
        :showArrow="false"
        type="submit"
        >Confirm</HyperlinkButton
      >
      <Loader :height="40" :width="40" v-else />
    </form>
    <p class="error" v-if="isError">
      There was a problem saving your grade level. Please refresh the page and
      try again.
    </p>
  </div>
</template>

<style lang="scss" scoped>
.grade-level-container {
  background: white;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 16px;
}
.grade-level-form {
  display: flex;
  flex-direction: row;
}

.save-button {
  align-self: flex-end;
}

h1 {
  font-size: 18px;
}

h2 {
  @include font-category('helper-text');
}

.success {
  color: $c-success-green;
}

.error {
  color: $c-error-red;
  margin: 0;
  padding-top: 8px;
  padding-bottom: 8px;
}

.header {
  display: flex;
  flex-direction: row;
}

.dismiss-button {
  margin-left: auto;
  margin-bottom: auto;

  .cross-icon {
    height: 20px;
    width: 20px;
  }
}
</style>
