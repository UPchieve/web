<script lang="ts" setup>
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import { computed, reactive } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import FormInput from '@/components/FormInput.vue'
import useVuelidate from '@vuelidate/core'
import FormEmail from '@/components/FormEmail.vue'
import FormPhoneInput from '@/components/FormPhoneInput.vue'

const props = defineProps<{ submitting: boolean }>()

const emit = defineEmits(['submit', 'cancel'])

const state = reactive({
  schoolId: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  phoneExtension: '',
  title: '',
})

const v = useVuelidate()
const isDisabled = computed(() => {
  return v.value.$error || !!v.value.$silentErrors?.length
})
</script>

<template>
  <form @submit.prevent="emit('submit', state)">
    <FormSchoolSearch
      :disabled="props.submitting"
      label="What school do you go to?"
      v-model="state.schoolId"
      :hasDefaultValue="false"
      :isRequired="true"
      startSearchEvent=""
      cannotFindSchoolEvent=""
      selectedEvent=""
    />
    <FormInput
      :disabled="props.submitting"
      v-model="state.title"
      :isRequired="true"
      label="Advisor's Title"
      placeholder="teacher, counselor, librarian, etc..."
      name="advisor-title"
    />
    <FormInput
      :disabled="props.submitting"
      :isRequired="true"
      v-model="state.firstName"
      label="First Name"
      name="advisor-first-name"
    />
    <FormInput
      :disabled="props.submitting"
      :isRequired="true"
      v-model="state.lastName"
      label="Last Name"
      name="advisor-first-name"
    />
    <FormEmail
      :disabled="props.submitting"
      :isRequired="true"
      v-model="state.email"
      label="Email"
      placeholder="Advisor's school email"
      name="advisor-email"
    />
    <FormPhoneInput
      :disabled="props.submitting"
      :isRequired="false"
      v-model="state.phone"
      label="Phone (optional)"
      name="advisor-phone"
    />
    <FormInput
      :disabled="props.submitting"
      :isRequired="false"
      v-model="state.phoneExtension"
      label="Phone extension (optional)"
      placeholder="x123"
      name="advisor-phone-ex"
    />

    <div class="footer">
      <LargeButton
        :disabled="props.submitting"
        :showArrow="false"
        v-on:click="emit('cancel')"
        >Cancel</LargeButton
      >
      <LargeButton
        variant="primary-blue"
        :showArrow="false"
        type="submit"
        :disabled="isDisabled || props.submitting"
        >Submit</LargeButton
      >
    </div>
  </form>
</template>

<style lang="scss" scoped>
.footer {
  border-top: rgb(224, 224, 224) 1px solid;
  padding-top: 1em;
  margin-top: 1em;
  display: flex;
  justify-content: end;
  align-items: center;
  gap: 12px;
}
</style>
