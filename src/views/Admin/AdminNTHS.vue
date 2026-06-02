<script setup lang="ts">
import { ref } from 'vue'
import NetworkService from '@/services/NetworkService'
import FormTextArea from '@/components/FormTextArea.vue'

const nthsChapertIds = ref<string>('')
const error = ref('')
const saving = ref(false)
const showSuccess = ref(false)
const UUIDregex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

function validate(uuids: string[]) {
  return uuids.map((id: string) => ({
    id,
    passed: UUIDregex.test(id),
  }))
}

async function onSubmitIds() {
  try {
    saving.value = true
    const chapterIds = nthsChapertIds.value
      .trim()
      .split(',')
      .map((v: string) => v.trim())

    const results = validate(chapterIds)
    if (results.every(({ passed }) => passed)) {
      await NetworkService.adminNTHSAffiliateWithSchool({
        chapterIds,
      })
      nthsChapertIds.value = ''
      showSuccess.value = true
      error.value = ''
      setTimeout(() => (showSuccess.value = false), 1500)
    } else {
      error.value = `Not valid ids: ${results
        .filter(({ passed }) => !passed)
        .map(({ id }) => id)
        .join(', ')}`
    }
  } catch (e) {
    error.value = String(e)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="card">
    <h1>Approve NTHS Chapters</h1>

    <p>
      Grab the NTHS chapter ids from the NTHS Admin retool dashboard and paste
      them here. They should be comma separated. Once you hit submit, we will
      mark that group as approved and send out the related email
    </p>
    <form @submit.prevent="onSubmitIds" autocomplete="off">
      <form-text-area
        :rows="5"
        label="NTHS Chapter IDs"
        name="nths-chapter-ids"
        v-model="nthsChapertIds"
        @update:modelValue="error = null"
        :customError="error"
        :is-required="false"
        :readOnly="saving"
      ></form-text-area>
      <div class="button-container">
        <span class="success" v-if="showSuccess">Saved!</span>
        <button
          class="uc-form-button"
          type="submit"
          :disabled="nthsChapertIds.length === 0 || saving"
        >
          {{ saving ? 'Saving' : 'Submit' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style lang="scss" scoped>
form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.success {
  color: $c-success-green;
}
.button-container {
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 24px;
  button {
    margin-top: 0;
    width: unset;
    padding: 12px 24px;
  }
}

.card {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;
  max-width: 1000px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
}
</style>
