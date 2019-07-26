<template>
  <form-page-template>
    <div class="uc-form">
      <div class="uc-form-body">
        <div class="title">You're logged out!</div>

        <router-link to="/login" class="uc-form-button" tag="button">
          Login
        </router-link>
      </div>

      <form-footer />
    </div>
  </form-page-template>
</template>

<script>
import FormPageTemplate from "@/components/FormPageTemplate";
import FormFooter from "@/components/FormFooter";

export default {
  components: {
    FormPageTemplate,
    FormFooter
  },
  data() {
    return {
      mainWebsiteUrl: process.env.VUE_APP_MAIN_WEBSITE_URL
    };
  }
};
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
