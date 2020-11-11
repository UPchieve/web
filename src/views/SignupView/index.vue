<template>
  <form-page-template>
    <div class="uc-form">
      <nav class="uc-form-header">
        <router-link to="/login" class="uc-form-header-link"
          >Log In</router-link
        >
      </nav>

      <volunteer-form v-if="this.userSelection === 'volunteer'" />
      <student-form v-else-if="this.userSelection === 'student'" />
      <div v-else class="uc-form-body uc-form-body--center">
        <div>
          <h3 class="">Welcome to UPchieve!</h3>
          <p class="uc-form-text">
            We are a nonprofit that provides free, online tutoring and college
            counseling to eligible high school students.
          </p>
        </div>
        <div class="btn-container">
          <h4 class="uc-subheader">How can we help you?</h4>
          <button
            class="uc-form-button-big"
            type="submit"
            @click.prevent="selectStudent()"
          >
            I need an Academic Coach
          </button>

          <button
            class="uc-form-button-big"
            type="submit"
            @click.prevent="selectVolunteer()"
          >
            I’d like to become an Academic Coach
          </button>
        </div>
      </div>
      <form-footer v-if="!isMobileApp" />
    </div>
  </form-page-template>
</template>

<script>
import { mapState } from "vuex";
import FormPageTemplate from "@/components/FormPageTemplate";
import StudentForm from "./StudentForm";
import VolunteerForm from "./VolunteerForm";
import FormFooter from "@/components/FormFooter";

export default {
  name: "signup-view",
  components: {
    FormPageTemplate,
    StudentForm,
    VolunteerForm,
    FormFooter
  },

  created() {
    this.$store.dispatch("app/hideNavigation");

    if (this.$route.query.referral)
      window.localStorage.setItem(
        "upcReferredByCode",
        this.$route.query.referral
      );

    if (this.$route.params)
      if (this.isMobileApp || this.$route.params.userType === "student")
        this.userSelection = "student";
      else if (this.$route.params.userType === "volunteer")
        this.userSelection = "volunteer";
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp
    })
  },
  data() {
    return {
      userSelection: null
    };
  },
  methods: {
    selectVolunteer() {
      this.$router.push("/sign-up/volunteer");
      this.userSelection = "volunteer";
    },
    selectStudent() {
      this.$router.push("/sign-up/student");
      this.userSelection = "student";
    }
  }
};
</script>

<style lang="scss" scoped>
.uc-form-header {
  flex-direction: row-reverse;
}

.uc-subheader {
  color: $c-secondary-grey;
  font-weight: 600;
}

.uc-form-body {
  .uc-column {
    margin-top: 25px;
  }
}

.btn-container {
  margin-bottom: 25px;
  button:first-of-type {
    margin: 15px 0 15px;
  }
}
</style>
