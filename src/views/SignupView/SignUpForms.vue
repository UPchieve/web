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
          :disabled="
            el.submitAction ? v$.$error || !!v$.$silentErrors.length : false
          "
          v-bind="el.props"
          @click="
            el.submitAction ? submitWithValidation(el.submitAction) : null
          "
        >
          {{ el.content }}
        </component>
      </div>
    </form>
  </form-page-template>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import UpdogCrying from '@/assets/updog-crying.svg'
import FormEmail from '@/components/FormEmail.vue'
import FormInput from '@/components/FormInput.vue'
import FormErrors from '@/components/FormErrors.vue'
import FormPassword from '@/components/FormPassword.vue'
import FormSchoolSearch from '@/components/FormSchoolSearch.vue'
import FormSelect from '@/components/FormSelect.vue'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import * as SignUpService from '@/services/SignUpService'

export default {
  name: 'sign-up-forms',
  components: {
    UpdogCrying,
    FormEmail,
    FormInput,
    FormErrors,
    FormPassword,
    FormSchoolSearch,
    FormSelect,
    FormPageTemplate,
  },

  setup() {
    return { v$: useVuelidate() }
  },

  data() {
    return {
      error: null,
      pageDetails: {},
    }
  },

  async created() {
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
      const [nextRoute, error] = await submit(this.getFormData())
      if (error) {
        this.error = error
        return
      }
      this.$router.push({ path: nextRoute })
    },
    getFormData() {
      const form = document.getElementById('form')
      return new FormData(form)
    },
    getPageDetails(to, from) {
      this.pageDetails = SignUpService.getPageDetails(to, from)
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

p {
  margin-bottom: 12px;
}

.el-gap {
  gap: 10px;
}

.button-narrow {
  max-width: 185px;
}

.screen-narrow {
  max-width: 512px;
}

.updog-crying {
  height: 185px;
}
</style>
