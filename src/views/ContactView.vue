<template>
  <div
    class="contact-wrapper"
    :class="{ 'contact-wrapper--noAuth': !isAuthenticated }"
  >
    <div class="contact" :class="{ 'contact--noAuth': !isAuthenticated }">
      <div class="contact__header">
        Contact Us
      </div>

      <div class="contact-form contact__form">
        <div v-if="!hasValidEmail" class="contact-form__section">
          <div class="contact-form__label">Your email</div>
          <input
            class="contact-form__text"
            type="text"
            v-model="contactFormData.email"
          />
        </div>

        <div class="contact-form__section">
          <div class="contact-form__label">Select reason</div>
          <v-select
            class="contact-form__select"
            v-model="contactFormData.topic"
            :options="contactTopics"
            :searchable="false"
          ></v-select>
        </div>

        <div class="contact-form__section">
          <div class="contact-form__label">Message</div>
          <textarea
            class="contact-form__textarea"
            v-model="contactFormData.message"
            rows="5"
          />
        </div>

        <div class="contact-form__section">
          <large-button
            class="contact-form__submit"
            primary
            @click.native="submitContactUs"
            >Send</large-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import NetworkService from "../services/NetworkService";
import LargeButton from "@/components/LargeButton";

export default {
  name: "contact-view",
  components: { LargeButton },
  created() {
    if (!this.isAuthenticated) {
      this.$store.dispatch("app/hideNavigation");
    }
  },
  data() {
    const contactTopics = [
      "Feedback",
      "Technical issue",
      "Incident report",
      "Feature request",
      "Subject suggestion",
      "Other"
    ];

    return {
      contactTopics,
      contactFormData: {
        email: "",
        topic: contactTopics[0],
        message: ""
      }
    };
  },
  computed: {
    ...mapGetters({
      isAuthenticated: "user/isAuthenticated"
    }),

    hasValidEmail() {
      if (!this.isAuthenticated) return false;

      return this.isValidEmail(this.$store.state.user.user.email);
    }
  },
  watch: {
    isAuthenticated(isAuthed) {
      if (isAuthed) {
        this.$store.dispatch("app/showNavigation");
      } else {
        this.$store.dispatch("app/hideNavigation");
      }
    }
  },
  methods: {
    submitContactUs() {
      if (
        !this.isAuthenticated &&
        !this.isValidEmail(this.contactFormData.email)
      ) {
        alert("A valid email is required.");
      } else {
        if (this.hasValidEmail) {
          this.contactFormData.email = this.$store.state.user.user.email;
        }

        NetworkService.sendContact(this, {
          responseData: this.contactFormData
        });
        this.$router.push("/");
      }
    },
    isValidEmail(address) {
      var re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return re.test(String(address).toLowerCase());
    }
  }
};
</script>

<style lang="scss" scoped>
.contact-wrapper {
  padding: 40px 20px;

  @include breakpoint-above("large") {
    padding: 40px;
  }

  &--noAuth {
    @include flex-container(row, center, center);
    background: url("~@/assets/onboarding_background.png") no-repeat center
      fixed;
    background-size: cover;
    min-height: 100vh;
  }
}

.contact {
  @include flex-container(column, space-between, flex-start);
  max-width: 800px;
  padding: 40px 20px;
  border-radius: 8px;
  background: #fff;

  @include breakpoint-above("large") {
    padding: 40px 40px 60px;
  }

  &__header {
    color: $c-soft-black;
    font-size: 24px;
    font-weight: 500;
    margin-bottom: 30px;
  }

  &__form {
    align-self: stretch;
  }

  &--noAuth {
    border-radius: 0;
    margin-left: auto;
    margin-right: auto;
    flex-basis: 500px;
  }
}

.contact-form {
  @include child-spacing(top, 30px);
  max-width: 500px;

  &__section {
    @include flex-container(column, space-between, stretch);
  }

  &__label {
    font-size: 16px;
    font-weight: 600;
    align-self: flex-start;
    margin-bottom: 10px;
  }

  &__text,
  &__textarea {
    border: solid 1px $c-border-grey;
    border-radius: 4px;
    font-size: 16px;
    padding: 10px 15px;

    &:focus {
      outline: none;
    }
  }

  &__textarea {
    resize: none;
  }

  &__select {
    font-size: 16px;
  }
}
</style>
