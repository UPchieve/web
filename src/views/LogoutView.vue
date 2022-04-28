<template>
  <form-page-template>
    <div class="uc-form">
      <div class="uc-form-body">
        <div class="title">You're logged out!</div>

        <router-link to="/login" class="uc-form-button" tag="button">
          Login
        </router-link>
      </div>

      <form-footer v-if="!isMobileApp" />
    </div>
  </form-page-template>
</template>

<script>
import { mapState } from 'vuex'
import FormPageTemplate from '@/components/FormPageTemplate'
import FormFooter from '@/components/FormFooter'
import config from '../config'

export default {
  components: {
    FormPageTemplate,
    FormFooter
  },
  created() {
    this.$store.dispatch('app/hideNavigation')
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp
    })
  },
  data() {
    return {
      mainWebsiteUrl: config.mainWebsiteUrl
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
