import { useVuelidate } from '@vuelidate/core'

const validations = {
  setup() {
    return { v$: useVuelidate() }
  },
  methods: {
    hasValidationError() {
      return this.v$.$error
    },
    getValidationErrors() {
      return this.v$.$errors.map((e) => e.$message).join(', ')
    },
  },
}
export default validations
