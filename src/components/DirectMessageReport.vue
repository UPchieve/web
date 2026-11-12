<script lang="ts" setup>
import { computed, ref } from 'vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import LargeButton from '@/components/LargeButton.vue'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'

const props = defineProps<{
  conversationId: string
  partnerType: 'coach' | 'student'
}>()

const emit = defineEmits<{
  cancel: []
  submitted: []
  submitting: [value: boolean]
}>()

const reportReason = ref('')
const reportMessage = ref('')
const error = ref('')
const isSubmitting = ref(false)

const reportReasons = computed(() =>
  props.partnerType === 'student'
    ? [
        '[Immediate ban] Student extremely rude/inappropriate',
        'I am worried for the immediate safety of this student',
      ]
    : [
        'Coach asked me to connect off of UPchieve',
        'Coach made me feel uncomfortable or unsafe',
        'Coach used inappropriate language',
        'Coach talked about inappropriate and offensive topics',
      ]
)

async function submitReport() {
  if (!reportReason.value || isSubmitting.value) return

  error.value = ''
  isSubmitting.value = true
  emit('submitting', true)

  try {
    await NetworkService.reportDirectMessage(props.conversationId, {
      reportReason: reportReason.value,
      reportMessage: reportMessage.value.trim() || undefined,
    })
    emit('submitted')
  } catch (err) {
    LoggerService.noticeError(err)
    error.value = 'Failed to submit report. Please try again.'
  } finally {
    isSubmitting.value = false
    emit('submitting', false)
  }
}
</script>

<template>
  <form
    class="dm-report"
    @submit.prevent="submitReport"
    aria-labelledby="dm-report-title"
    autocomplete="off"
  >
    <h2 id="dm-report-title">Report this conversation</h2>
    <p>
      Only report serious safety or community guideline concerns. Your report
      will be sent to UPchieve staff.
    </p>
    <p v-if="partnerType === 'student'">
      Reporting inappropriate behavior will immediately ban the student.
      Reporting a safety concern will alert staff without banning them.
    </p>
    <FormSelect
      name="dm-report-reason"
      label="Reason for reporting"
      v-model="reportReason"
      :options="reportReasons"
      :disabled="isSubmitting"
    />
    <label for="dm-report-message">Tell us what happened (optional)</label>
    <textarea
      id="dm-report-message"
      v-model="reportMessage"
      rows="4"
      :disabled="isSubmitting"
      autocomplete="off"
    />
    <p v-if="error" role="alert" data-testid="dm-report-error">{{ error }}</p>
    <div class="dm-report__actions">
      <LargeButton
        type="button"
        :disabled="isSubmitting"
        @click="emit('cancel')"
        :show-arrow="false"
        >Cancel</LargeButton
      >
      <LargeButton
        type="submit"
        variant="primary-blue"
        :disabled="!reportReason || isSubmitting"
        data-testid="dm-submit-report"
        :show-arrow="false"
      >
        {{ isSubmitting ? 'Submitting...' : 'Report' }}
      </LargeButton>
    </div>
  </form>
</template>

<style scoped lang="scss">
.dm-report {
  padding: 24px;
  overflow-y: auto;

  label {
    display: block;
    margin-top: 16px;
  }

  textarea {
    width: 100%;
    border: 1px solid $c-border-grey;
    border-radius: 4px;
    padding: 8px;
    font: inherit;
  }

  [role='alert'] {
    color: $c-error-red;
  }

  &__actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
}
</style>
