<template>
  <button
    class="uc-form-button"
    :class="{
      google: useGoogle,
    }"
    @click="$emit('click')"
  >
    <google-logo v-if="useGoogle" />
    {{ buttonText }}
  </button>
</template>

<script>
import GoogleLogo from '@/assets/google_logo.svg'

export default {
  components: {
    GoogleLogo,
  },
  props: {
    buttonText: {
      type: String,
    },
    ssoMethod: {
      type: String,
      default: 'google',
    },
  },

  computed: {
    useGoogle() {
      return this.ssoMethod === 'google'
    },
  },
}
</script>
