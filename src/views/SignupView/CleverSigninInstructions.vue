<script lang="ts" setup>
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import SsoButton from '@/components/SsoButton.vue'
import { SsoProvider, signInWithSso } from '@/services/SsoService'

function signInWithClever() {
  signInWithSso({
    provider: SsoProvider.CLEVER,
    isLogin: 'true',
    errorRedirect: '/clever-signin-instructions',
  })
}
</script>

<template>
  <form-page-template
    layout="panel-right-50p"
    panelImg="updog-crying"
    imageText="Uh oh, something went wrong!"
  >
    <div class="main">
      <div class="header">
        <h1 class="main-heading">
          Having trouble signing in to UPchieve with Clever?
        </h1>
      </div>
      <div class="instructions-text">
        <SsoButton
          @click="signInWithClever"
          class="sso-button"
          data-testid="cleverSsoButton"
          buttonText="Sign in with Clever"
          :ssoMethod="SsoProvider.CLEVER"
        />
        <h2 class="second-heading">Or go back to the Clever Portal</h2>
        <p>
          Go to <a href="https://clever.com/" class="links">clever.com</a> and
          login with your school account (unless you're already logged in).
        </p>
        <h2 class="second-heading">Click on the UPchieve Tile</h2>
        <p>This will open UPchieve and should sign you in automatically.</p>
        <h2 class="second-heading">Still not working?</h2>
        <p>
          Try closing your browser completely, then repeat the steps above. If
          the issue continues, reach out to UPchieve for support by
          <router-link to="/contact" class="links">clicking here!</router-link>
        </p>
      </div>
    </div>
  </form-page-template>
</template>

<style lang="scss" scoped>
.main {
  @include flex-container(column, flex-start, center);
  padding: 30px;
  height: 100%;
}

.header {
  text-align: center;
}

.main-heading {
  font-size: 32px;
}

.second-heading {
  font-size: 24px;
}

.instructions-text {
  text-align: center;
  margin-top: 16px;
}

.links {
  color: $c-information-blue;
}

.sso-button {
  margin: 8px auto 16px;
  max-width: 300px;
}
</style>
