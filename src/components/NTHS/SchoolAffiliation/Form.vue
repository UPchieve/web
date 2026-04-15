<script lang="ts" setup>
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import { computed, reactive, ref } from 'vue'
import LargeButton from '@/components/LargeButton.vue'
import FormInput from '@/components/FormInput.vue'
import useVuelidate from '@vuelidate/core'
import FormEmail from '@/components/FormEmail.vue'
import FormPhoneInput from '@/components/FormPhoneInput.vue'

const props = defineProps<{ submitting: boolean }>()

const emit = defineEmits(['submit', 'cancel'])

const formInputs = reactive({
  schoolId: null,
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  phoneExtension: '',
  title: '',
})

const showSchoolSearch = ref<boolean>(true)

const v = useVuelidate()
const isDisabled = computed(() => {
  return v.value.$error || !!v.value.$silentErrors?.length
})

function onCantFindSchool() {
  formInputs.schoolId = null
  showSchoolSearch.value = false
}
</script>

<template>
  <form @submit.prevent="emit('submit', formInputs)" autocomplete="off">
    <FormSchoolSearch
      v-if="showSchoolSearch"
      :disabled="props.submitting"
      label="What school do you go to?"
      v-model="formInputs.schoolId"
      :hasDefaultValue="false"
      :isRequired="false"
      startSearchEvent=""
      cannotFindSchoolEvent=""
      selectedEvent=""
      :showCannotFindSchoolForm="false"
    >
      <template v-slot:cannotFindSchool>
        <div class="cant-find-school-container">
          <button
            type="button"
            class="school-search-button"
            @click="onCantFindSchool"
          >
            (Skip) My school isn't listed
          </button>
        </div>
      </template>
    </FormSchoolSearch>
    <button
      class="school-search-button"
      v-else
      type="button"
      @click="() => (showSchoolSearch = true)"
      :showArrow="false"
    >
      (Optional) Search for my school
    </button>
    <FormInput
      :disabled="props.submitting"
      v-model="formInputs.title"
      :isRequired="true"
      label="Advisor's Title"
      placeholder="teacher, counselor, librarian, etc..."
      name="advisor-title"
    />
    <FormInput
      :disabled="props.submitting"
      :isRequired="true"
      v-model="formInputs.firstName"
      label="First Name"
      name="advisor-first-name"
    />
    <FormInput
      :disabled="props.submitting"
      :isRequired="true"
      v-model="formInputs.lastName"
      label="Last Name"
      name="advisor-first-name"
    />
    <FormEmail
      :disabled="props.submitting"
      :isRequired="true"
      v-model="formInputs.email"
      label="Email"
      placeholder="Advisor's school email"
      name="advisor-email"
    />
    <FormPhoneInput
      :disabled="props.submitting"
      :isRequired="false"
      v-model="formInputs.phone"
      label="Phone (optional)"
      name="advisor-phone"
    />
    <FormInput
      :disabled="props.submitting"
      :isRequired="false"
      v-model="formInputs.phoneExtension"
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

.cant-find-school-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px;
}

.school-search-button {
  color: $c-information-blue;
  display: flex;
}
</style>
