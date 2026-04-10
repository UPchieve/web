<script lang="ts" setup>
import { ref } from 'vue'
import { isEmpty } from 'lodash-es'
import FormInput from '@/components/FormInput.vue'
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'
import type { AxiosError } from 'axios'

const districtId = ref<string>('')
const cleverSchoolId = ref<string>('')
const upchieveSchoolId = ref<string>('')
const isSubmitting = ref<boolean>(false)
const msg = ref<string | JSON>()
const isError = ref<boolean>(false)

async function onSubmitRoster() {
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

async function onSubmitSchool() {
  isError.value = false
  msg.value = ''

  try {
    await NetworkService.adminCleverAddSchoolMapping(
      cleverSchoolId.value,
      upchieveSchoolId.value
    )
    msg.value = 'Success!'
    cleverSchoolId.value = ''
    upchieveSchoolId.value = ''
  } catch (err) {
    msg.value =
      ((err as AxiosError).response?.data as { err?: string }).err ??
      'Something went wrong.'
    isError.value = true
  }
}

function disableRosterSubmit() {
  return !districtId.value
}

function disableSchoolSubmit() {
  return !cleverSchoolId.value && !upchieveSchoolId.value
}
</script>

<template>
  <div>
    <loader v-if="isSubmitting" overlay />

    <div
      v-if="msg"
      class="m-4 alert alert-success"
      :class="{
        'alert-danger': isError,
      }"
      role="alert"
    >
      <pre>{{ msg }}</pre>
    </div>

    <div class="card">
      <h1>Clever Roster</h1>

      <p>
        To perform this student roster, you first need to add any of the schools
        you want rostered by using the Clever School Mapping form below. If a
        school has not been explicitly added, even if it has an NCES ID in
        Clever, it will NOT be processed.
      </p>
      <p>
        This roster also requires that we can get the email, first name, and
        last name for students from Clever. Before performing the roster, go
        into the Clever portal and browse the data for the district (in Data
        Compatibility section). If any of the required fields are missing, those
        records will be skipped and will be marked as such in the output report.
      </p>
      <form @submit.prevent="onSubmitRoster" autocomplete="off">
        <form-input
          label="Clever District ID"
          name="clever-district-id"
          v-model="districtId"
          :is-required="false"
        ></form-input>
        <button
          class="uc-form-button"
          type="submit"
          :disabled="disableRosterSubmit() ? true : undefined"
        >
          Submit
        </button>
      </form>
    </div>

    <div class="card">
      <h1>Clever School Mapping</h1>
      <p>
        Before running the Clever Roster above, you'll need to add explicit
        mappings of schools in Clever to schools in UPchieve. Schools without
        this explicit mapping, even if they have an NCES ID, will NOT roster.
      </p>
      <p>Simply enter the Clever and UPchieve school IDs below.</p>
      <form @submit.prevent="onSubmitSchool" autocomplete="off">
        <form-input
          label="Clever School ID"
          name="clever-school-id"
          v-model="cleverSchoolId"
          :is-required="false"
        />
        <form-input
          label="UPchieve School ID"
          name="upchieve-school-id"
          v-model="upchieveSchoolId"
          :is-required="false"
        />
        <button
          class="uc-form-button"
          type="submit"
          :disabled="disableSchoolSubmit() ? true : undefined"
        >
          Submit
        </button>
      </form>
    </div>
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
