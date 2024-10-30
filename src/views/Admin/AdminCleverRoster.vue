<script lang="ts" setup>
import { ref } from 'vue'
import { isEmpty } from 'lodash'
import FormInput from '@/components/FormInput.vue'
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'
import type { AxiosError } from 'axios'

const districtId = ref<string>('')
const isSubmitting = ref<boolean>(false)
const msg = ref<string | JSON>()
const isError = ref<boolean>(false)

async function submit() {
  isError.value = false
  msg.value = ''

  try {
    const {
      data: { report },
    } = await NetworkService.adminCleverRoster(districtId.value)
    if (!isEmpty(report.failedSchools)) {
      isError.value = true
    }
    msg.value = report
  } catch (err) {
    msg.value =
      ((err as AxiosError).response?.data as { err?: string }).err ??
      'Something went wrong.'
    isError.value = true
  }
}

function disableSubmit() {
  return !districtId.value
}
</script>

<template>
  <div class="card">
    <h1>Clever Roster</h1>

    <loader v-if="isSubmitting" overlay />

    <div
      v-if="msg"
      class="alert alert-success"
      :class="{
        'alert-danger': isError,
      }"
      role="alert"
    >
      <pre>{{ msg }}</pre>
    </div>

    <p>
      This integration assumes that we will be able to get both the nces_id for
      a school as well as the email (and first and last name) for students from
      Clever.
    </p>
    <p>
      Before performing the roster, go into the Clever portal and browse the
      data for the district (in Data Compatibility section). If any of the
      required fields are missing, those records will be skipped and will be
      marked as such in the output report.
    </p>
    <ul>
      <li>
        If a school is missing an nces_id, reach out to Clever support for them
        to fill it in.
      </li>
      <li>
        If any students are missing required fields, reach out to the district
        admin to ask for those fields to be filled. Otherwise, those students
        will not be updated.
      </li>
    </ul>
    <p>
      If all looks good, you can use the district's id in the form below to
      perform the roster.
    </p>
    <form @submit.prevent="submit">
      <form-input
        label="Clever District ID"
        name="clever-district-id"
        v-model="districtId"
      ></form-input>
      <button
        class="uc-form-button"
        type="submit"
        :disabled="disableSubmit() ? true : undefined"
      >
        Submit
      </button>
    </form>
  </div>
</template>

<style lang="scss" scoped>
.card {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
}

.alert {
  margin: 25px 0;
  white-space: pre-line;
}
</style>
