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

    <v-select
      :id="name"
      :label="optionTextField"
      :placeholder="placeholder"
      v-model="selection"
      :options="selectOptions"
      :reduce="reduce"
      :searchable="false"
      :clearable="false"
      :loading="isLoading"
      class="uc-form-select-input"
      :class="{
        'uc-form-select-input-invalid': hasValidationError(),
      }"
      @close="onBlur"
      :required="isRequired"
    />
    <input hidden :name="name" :value="selection" />
  </div>
</template>

<script>
import { helpers, requiredIf } from '@vuelidate/validators'
import AnalyticsService from '@/services/AnalyticsService'
import InputValidation from '@/mixins/InputValidation'

export default {
  props: {
    blurEvent: {
      type: String,
    },
    getSelectOptions: {
      type: Function,
      required: true,
    },
    isRequired: {
      type: Boolean,
      default: true,
    },
    label: {
      type: String,
    },
    name: {
      type: String,
    },
    optionTextField: {
      type: String,
    },
    placeholder: {
      type: String,
    },
    reduce: {
      type: Function,
    },
  },

  mixins: [InputValidation],

  async created() {
    this.isLoading = true
    this.selectOptions = await this.getSelectOptions()
    this.isLoading = false
  },

  data() {
    return {
      selection: null,
      hasSelectedOption: false,
      isLoading: false,
      selectOptions: [],
    }
  },

  validations() {
    return {
      selection: {
        required: helpers.withMessage('Required', requiredIf(this.isRequired)),
      },
    }
  },

  methods: {
    onBlur() {
      this.v$.selection.$touch()
      if (this.selection && !this.hasSelectedOption) {
        AnalyticsService.captureEvent(this.blurEvent)
        this.hasSelectedOption = true
      }
    },
  },
}
</script>
