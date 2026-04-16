<template>
  <button
    type="button"
    class="uc-form-button sso"
    @click.prevent="$emit('click')"
  >
    <google-logo v-if="useGoogle" class="logo" />
    <clever-logo v-if="useClever" class="logo" />
    <img
      v-if="useClassLink"
      src="@/assets/classlink_logo.png"
      class="logo logo--img"
    />
    {{ buttonText }}
  </button>
</template>

<script>
import GoogleLogo from '@/assets/google_logo.svg'
import CleverLogo from './CleverLogo.vue'

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
    useClassLink() {
      return this.ssoMethod === 'classlink'
    },
  },
}
</script>

<style lang="scss" scoped>
.logo {
  margin-right: 0.4em;
  height: 100%;
  &--img {
    height: 30px;
    width: 30px;
  }
}
</style>
