<template>
  <form-page-template>
    <div class="uc-form">
      <h1 class="title">You're logged out!</h1>

      <router-link to="/login" class="uc-form-button" tag="button">
        Login
      </router-link>
    </div>
  </form-page-template>
</template>

<script>
import { mapState } from 'vuex'
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import config from '../config'

export default {
  components: {
    FormPageTemplate,
  },
  created() {
    this.$store.dispatch('app/hideNavigation')
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp,
    }),
  },
  data() {
    return {
      mainWebsiteUrl: config.mainWebsiteUrl,
    }
  },
}
</script>

<style lang="scss" scoped>
.uc-form {
  @include flex-container(column, center, center);
}

.title {
  color: black;
  font-size: 24px;
  font-weight: 600;
  margin: 50px 0px;
  text-align: center;
}
</style>
