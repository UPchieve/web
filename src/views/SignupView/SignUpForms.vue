<template>
  <form-page-template :layout="pageDetails.backgroundLayout">
    <FormErrors :errors="error ? [error] : []" />

    <form
      id="form"
      class="h-full form"
      :class="pageDetails.classes"
      @submit.prevent="submitWithValidation.bind(pageDetails.submitAction)"
    >
      <div
        class="uc-row el-gap"
        :class="row.classes"
        v-for="(row, i) in pageDetails.rows"
        :key="`${i}_${$route.path}`"
      >
        <component
          v-for="(el, j) in row.elements"
          :key="`${i}-${j}_${$route.path}`"
          :is="el.element"
          :class="el.classes"
          :disabled="isDisabled(el)"
          v-bind="el.props"
          @click="
            el.submitAction && el.isDisabledOnInvalid
              ? submitWithValidation(el.submitAction)
              : el.submitAction
                ? submit(el.submitAction)
                : null
          "
        >
          {{ el.content }}
        </component>
      </div>
    </form>
    <loader v-if="isSubmitting" overlay />
  </form-page-template>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import CheckCircled from '@/assets/check-circled.svg'
import UpdogCrying from '@/assets/updog-crying.svg'
import UpdogSmiling from '@/assets/updog-smiling.svg'
import FormEmail from '@/components/FormEmail.vue'
import FormInput from '@/components/FormInput.vue'
import FormErrors from '@/components/FormErrors.vue'
import FormPassword from '@/components/FormPassword.vue'
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import FormSelect from '@/components/FormSelect.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import LineDivider from '@/components/LineDivider.vue'
import Loader from '@/components/Loader.vue'
import SsoButton from '@/components/SsoButton.vue'
import * as SignUpService from '@/services/SignUpService'

export default {
  name: 'sign-up-forms',
  components: {
    CheckCircled,
    UpdogCrying,
    UpdogSmiling,
    FormEmail,
    FormInput,
    FormErrors,
    FormPassword,
    FormSchoolSearch,
    FormSelect,
    FormPageTemplate,
    Loader,
    LineDivider,
    SsoButton,
  },

  setup() {
    return { v$: useVuelidate() }
  },

  data() {
    return {
      error: null,
      isSubmitting: false,
      pageDetails: {},
    }
  },

  async created() {
    const error = this.$route.query.error
    if (error) {
      this.error = error
      delete this.$route.query.error
    }

    this.getPageDetails(this.$route)
  },

  watch: {
    $route(to, from) {
      this.getPageDetails(to, from)
    },
  },

  methods: {
    async submitWithValidation(submit) {
      if (!(await this.v$.$validate())) {
        return
      }

      await this.submit(submit)
    },
    async submit(submit) {
      this.isSubmitting = true
      this.error = null

      try {
        const [next, error] = await submit(this.getSubmitData())
        if (error) {
          this.error = error
          return
        }

        this.$router.replace(next)
      } catch (err) {
        this.error = 'Unknown server error'
      } finally {
        this.isSubmitting = false
      }
    },
    getSubmitData() {
      const form = document.getElementById('form')
      const data = {}
      for (const [key, value] of new FormData(form)) {
        data[key] = value
      }
      const merged = { ...data, ...this.$route.params, ...this.$route.query }
      return merged
    },
    getPageDetails(to, from) {
      this.pageDetails = SignUpService.getPageDetails(to, from)
    },
    isDisabled(el) {
      if (el.isDisabledOnInvalid) {
        return this.v$.$error || !!this.v$.$silentErrors?.length
      }

      return false
    },
  },
}
</script>

<style lang="scss" scoped>
.form {
  max-width: 650px;
}

h1 {
  font-size: 24px;
  font-weight: 500;
}

h2 {
  font-size: 22px;
  font-weight: 500;
}

p {
  margin-bottom: 12px;
}

.bold {
  font-weight: 500;
}

.el-gap {
  gap: 10px;
}

.button-narrow {
  padding: 0 25px;
  width: fit-content;
}

.screen-narrow {
  max-width: 512px;
}

.updog {
  height: 185px;
}
</style>
