<template>
  <div class="background">
    <div class="main-page">
      <div class="logo-class">
        <img class="logo-img" src="../assets/p_logo_white.png" />
      </div>
      <div class="form-div">
        <error-feedback>
          <login-form-element />
        </error-feedback>
      </div>
      <div class="bottom-div"></div>
    </div>
  </div>
</template>

<script>
import AuthService from 'src/services/AuthService'
import ErrorFeedback from './ErrorFeedback'
import LoginFormElement from './LoginFormElement'

export default {
  components: {
    ErrorFeedback,
    LoginFormElement
  }
}
</script>

<style lang="scss" scoped>
.background {
  display: flex;
  background-image: url('../assets/onboarding_background.png');
  background-size: cover;
  height: 100%;
  font-size: 16px;
  margin-left: -300px;
  position: relative;
  z-index: 2;
}

.main-page {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.logo-img {
  width: 155px;
  padding-bottom: 25px;
}

.logo-class {
  flex: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bottom-div {
  flex: 1;
}






@media screen and (max-width: 488px) {
  .background {
    margin-left: 0em !important;
    padding-left: 0em !important;
  }

  .logo-img {
    width: 40% !important;
    min-width: 110px !important;
  }

  .form-div {
    width: 100vw !important;
  }
}
</style>
