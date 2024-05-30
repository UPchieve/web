<template>
  <div class="uc-form-element w-full">
    <div class="uc-row justify-between">
      <label
        :for="name"
        :class="{
          error: hasValidationError(),
        }"
        >{{ label }}</label
      >
      <div v-if="hasValidationError()" class="error-caption">
        {{ getValidationErrors() }}
      </div>
    </div>
    <autocomplete
      :id="name"
      :placeholder="placeholder"
      :search="autocompleteSchool"
      :get-result-value="getSchoolDisplayName"
      :debounce-time="500"
      @submit="handleSelectSchool"
      @blur="onBlur"
      base-class="uc-form-autocomplete-input"
      :class="{
        'uc-form-autocomplete-input-invalid': hasValidationError(),
      }"
      :required="isRequired"
    >
      <template #result="{ result, props }">
        <li v-bind="props">
          <div v-if="result.name" id="ph-no-capture" class="result">
            {{ result.name }} ({{ result.city }}, {{ result.state }})
          </div>
          <a
            v-if="result.cannotFindSchool"
            target="_blank"
            href="https://upchieve.org/cant-find-school"
          >
            <div class="result">
              {{ CANNOT_FIND_SCHOOL_TEXT }}
            </div>
          </a>
        </li>
      </template>
    </autocomplete>
    <input hidden :name="name" :value="school.id" />
  </div>
</template>

<script>
import Autocomplete from '@trevoreyre/autocomplete-vue'
import { helpers, requiredIf } from '@vuelidate/validators'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import { useInputValidation } from '@/composables/InputValidation'

export default {
  components: {
    Autocomplete,
  },

  props: {
    isRequired: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
      default: 'School Name',
    },
    name: {
      type: String,
      default: 'school',
    },
    placeholder: {
      type: String,
      default: 'School Name',
    },
  },

  created() {
    this.CANNOT_FIND_SCHOOL_TEXT = `Can't find your school?`
  },

  setup() {
    const { v$, hasValidationError, getValidationErrors } = useInputValidation()
    return { v$, hasValidationError, getValidationErrors }
  },

  data() {
    return {
      school: {},
      hasStartedSearchingForSchool: false,
    }
  },

  validations() {
    return {
      school: {
        required: helpers.withMessage('Required', requiredIf(this.isRequired)),
      },
    }
  },

  methods: {
    async autocompleteSchool(input) {
      this.school = {}

      if (!this.hasStartedSearchingForSchool)
        AnalyticsService.captureEvent(EVENTS.STUDENT_SEARCHED_SCHOOL)
      this.hasStartedSearchingForSchool = true

      return new Promise((resolve) => {
        if (input.length < 3) {
          return resolve([])
        }

        const cannotFindSchoolItem = {
          cannotFindSchool: true,
        }

        NetworkService.searchSchool({ query: input })
          .then((response) => response.data.results)
          .then((schools) => {
            schools.push(cannotFindSchoolItem)
            resolve(schools)
          })
      })
    },
    getSchoolDisplayName(school) {
      if (school.cannotFindSchool) {
        return
      }
      return `${school.name} (${school.city}, ${school.state})`
    },
    handleSelectSchool(school) {
      if (school.value === this.CANNOT_FIND_SCHOOL_TEXT) {
        AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_CANT_FIND_SCHOOL)
      } else {
        AnalyticsService.captureEvent(EVENTS.STUDENT_SELECTED_SCHOOL)
        this.school = school || {}
      }
    },

    onBlur() {
      this.v$.school.$touch()
    },
  },
}
</script>
