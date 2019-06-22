<template>
  <form-page-template>
    <div class="uc-form">
      <div class="uc-form-body">
        <div class="title">You're logged out!</div>

        <router-link to="/login" class="uc-form-button" tag="button">
          Login
        </router-link>

        <router-link to="/feedback" class="uc-form-button" tag="button">
          Give Feedback
        </router-link>
      </div>

      <form-footer />
    </div>
  </form-page-template>
</template>

<script>
import FormPageTemplate from './form/FormPageTemplate'
import FormFooter from './form/FormFooter'

export default {
  components: {
    FormPageTemplate,
    FormFooter
  },
  data () {
    return {
      mainWebsiteUrl: process.env.MAIN_WEBSITE_URL
    }
  }
}
</script>

<style lang="scss" scoped>
.title {
  color: black;
  font-size: 24px;
  font-weight: 600;
  margin: 50px 0px;
  text-align: center;
}
</style>
