<template>
  <button class="uc-form-button sso" @click="$emit('click')">
    <google-logo v-if="useGoogle" />
    <clever-logo v-if="useClever" />
    {{ buttonText }}
  </button>
</template>

<script>
import CleverLogo from '@/assets/clever_logo.svg'
import GoogleLogo from '@/assets/google_logo.svg'

export default {
  components: {
    CleverLogo,
    GoogleLogo,
  },
  props: {
    buttonText: {
      type: String,
    },
    ssoMethod: {
      type: String,
    },
  },

  computed: {
    useGoogle() {
      return this.ssoMethod === 'google'
    },
    useClever() {
      return this.ssoMethod === 'clever'
    },
  },
}
</script>
