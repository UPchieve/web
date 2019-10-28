<template>
  <form-page-template>
    <form class="uc-form">
      <div class="uc-form-header">
        <div class="uc-form-header-link--active">Reset Your Password</div>
        <div class="link-container">
          <router-link to="/login" class="uc-form-header-link"
            >Log In</router-link
          >
          <div>/</div>
          <router-link to="/signup" class="uc-form-header-link"
            >Sign Up</router-link
          >
        </div>
      </div>

      <div class="uc-form-body">
        <div class="uc-column">
          <label for="inputEmail" class="uc-form-label"
            >Please enter your email address</label
          >
          <input
            id="inputEmail"
            v-model="email"
            type="email"
            class="uc-form-input"
            required
            autofocus
          />
        </div>

        <button class="uc-form-button" type="submit" @click.prevent="submit()">
          Enter
        </button>

        <div v-if="msg !== ''">{{ msg }}</div>
      </div>
    </form>
  </form-page-template>
</template>

<script>
import AuthService from "@/services/AuthService";
import FormPageTemplate from "@/components/FormPageTemplate";

export default {
  components: {
    FormPageTemplate
  },
  created() {
    this.$store.dispatch("app/hideNavigation");
  },
  data() {
    return {
      email: "",
      msg: ""
    };
  },
  methods: {
    submit() {
      AuthService.sendReset(this, this.email);
    }
  }
};
</script>

<style lang="scss" scoped>
.link-container {
  @include flex-container(row, space-evenly);
  min-width: 150px;
}

@include breakpoint-below("tiny") {
  .uc-form-header {
    @include flex-container(column, center, center);
  }
}
</style>
