<template>
  <form-page-template
    :layout="pageDetails.backgroundLayout"
    :panelImg="pageDetails.panelImage"
    hideLogo="true"
  >
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
        <template v-for="(el, j) in row.elements">
          <component
            v-if="el.showIf ? el.showIf(form) : true"
            :key="`${i}-${j}_${$route.path}`"
            :is="el.element"
            :class="el.classes"
            :disabled="isDisabled(el)"
            v-bind="el.props"
            :model-value="el.props?.name ? form[el.props.name] : undefined"
            @update:model-value="
              (value) => {
                if (el.props?.name) form[el.props.name] = value
              }
            "
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
        </template>
      </div>
    </form>
    <loader v-if="isSubmitting" overlay />
  </form-page-template>
</template>

<script>
import { useVuelidate } from '@vuelidate/core'
import CheckCircled from '@/assets/check-circled.svg'
import HeaderLogoTeal from '@/assets/header-logo-teal.svg'
import UpdogCrying from '@/assets/updog-crying.svg'
import UpdogSmiling from '@/assets/updog-smiling.svg'
import FormCheckBox from '@/components/FormCheckBox.vue'
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

export default {
  name: 'sign-up-forms',
  components: {
    CheckCircled,
    HeaderLogoTeal,
    UpdogCrying,
    UpdogSmiling,
    FormCheckBox,
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

  props: {
    getPageDetails: {
      type: Function,
      required: true,
    },
  },

  setup() {
    return { v$: useVuelidate() }
  },

  data() {
    return {
      form: {},
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

    this.loadPageDetails(this.$route)
  },

  watch: {
    $route(to, from) {
      this.loadPageDetails(to, from)
    },
  },

  methods: {
    async submitWithValidation(submitAction) {
      if (!(await this.v$.$validate())) {
        return
      }

      await this.submit(submitAction)
    },
    async submit(submitAction) {
      this.isSubmitting = true
      this.error = null

      try {
        const [next, error] = await submitAction(this.getSubmitData())
        if (error) {
          this.error = error
          return
        }

        if (next) {
          this.$router.replace(next)
        }
      } catch (err) {
        this.error = 'Unknown server error'
      } finally {
        this.isSubmitting = false
      }
    },
    getSubmitData() {
      const merged = {
        ...this.form,
        ...this.$route.query,
        ...this.$route.params,
      }
      return merged
    },
    loadPageDetails(to, from) {
      this.pageDetails = this.getPageDetails(to, from)
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
  margin-bottom: 0;
}

.bold {
  font-weight: 500;
}

.el-gap {
  gap: 10px;
}

.el-gap-sm {
  gap: 4px;
}

.button-narrow {
  padding: 0 25px;
  min-width: 180px;
  width: fit-content;
}

.screen-narrow {
  max-width: 512px;
}

.updog {
  height: 185px;
}
</style>
