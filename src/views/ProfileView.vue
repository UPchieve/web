<template>
  <div class="profile">
    <div class="header">
      Your profile
      <button
        v-if="user.isVolunteer"
        class="editBtn btn"
        @click="editProfile()"
      >
        {{ editBtnMsg }}
      </button>
    </div>
    <div class="wrap-container">
      <div class="personal-info contain">
        <div v-if="errors.length" class="errors">
          <h4 class="errors-heading">
            Please correct the following problem
            <span v-if="errors.length > 1">s</span>
            before saving:
          </h4>
          <ul class="errors-list">
            <li v-for="error in errors" v-bind:key="error">{{ error }}</li>
          </ul>
        </div>
        <div v-if="saveFailed" class="errors">
          <h4 class="errors-heading">Could not save data</h4>
        </div>
        <div class="subheader">Personal Information</div>
        <div class="container-content">
          <div id="email" class="container-section">
            <div class="prompt">Your Email</div>
            <div class="answer">{{ user.email }}</div>
          </div>
          <div v-if="user.isVolunteer">
            <div id="phone" class="container-section">
              <div class="prompt">Your Phone Number</div>
              <div v-show="!activeEdit && user.phone" class="answer">
                {{ internationalPhoneInfo.number }}
              </div>
              <div v-show="!activeEdit && !user.phone" class="answer">
                (None given)
              </div>

              <vue-phone-number-input
                class="phone-input"
                v-show="activeEdit"
                v-model="phoneNational"
                :default-country-code="internationalPhoneInfo.country"
                :error="
                  invalidInputs.indexOf('phone') > -1 && !phoneInputInfo.isValid
                "
                :required="true"
                color="#555"
                valid-color="#16ba97"
                @update="onPhoneInputUpdate"
              />

              <div class="description">
                We will use this number to send you notifications when a student
                needs help. You will only receive notifications during the
                periods that you select in your schedule.
              </div>
            </div>
          </div>

          <div class="container-section resetBtn">
            <router-link to="/resetpassword" class="prompt"
              >Reset password</router-link
            >
          </div>
        </div>
      </div>

      <div v-if="user.isVolunteer" class="cert-info contain">
        <div class="subheader">Unlocked Subjects</div>
        <div class="container-content cert">
          <div
            v-for="(value, key) in subjects"
            :key="`certification-${key}-${value}`"
          >
            <div v-if="value" class="certBox">
              <div :class="certKey[key]" class="certKey">
                {{ certKey[key] }}
              </div>
              <div class="certValue">{{ key }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import PhoneNumber from "awesome-phonenumber";
import { mapGetters, mapState } from "vuex";
import UserService from "@/services/UserService";
import { topics, allSubtopics } from "@/utils/topics";

export default {
  name: "profile-view",
  data() {
    return {
      activeEdit: false,
      editBtnMsg: "Edit",
      errors: [],
      invalidInputs: [],
      saveFailed: false,
      phoneNational: "",
      phoneInputInfo: {}
    };
  },
  created() {
    if (this.user.isVolunteer && this.user.phone) {
      const num =
        this.user.phone[0] === "+" ? this.user.phone : `+1${this.user.phone}`;
      const pn = new PhoneNumber(num);
      this.phoneNational = pn.getNumber("national");

      // Hack to initially mock the vue-phone-number-input data
      this.phoneInputInfo = {
        isValid: true,
        e164: pn.getNumber("international")
      };
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({
      avatarUrl: "user/avatarUrl"
    }),
    name() {
      const user = this.$store.state.user.user;
      return user.firstname || (user.isVolunteer ? "volunteer" : "student");
    },
    internationalPhoneInfo() {
      if (!this.user.isVolunteer || !this.user.phone) return false;

      const num =
        this.user.phone[0] === "+" ? this.user.phone : `+1 ${this.user.phone}`;
      const pn = new PhoneNumber(num);

      return {
        number: pn.getNumber("international"),
        country: pn.getRegionCode()
      };
    },
    certKey() {
      let subtopicObj = {};

      for (let [topicName, topicData] of Object.entries(topics)) {
        for (let topic in topicData.subtopics) {
          if (topicData.subtopics.hasOwnProperty(topic)) {
            const { displayName } = topicData.subtopics[topic];
            subtopicObj[displayName] = topicName.toUpperCase();
          }
        }
      }
      return subtopicObj;
    },
    subjects() {
      const user = this.$store.state.user.user;

      const subjects = user.subjects.reduce(
        (displayObj, key) => {
          const subtopics = allSubtopics();

          if (subtopics[key]) {
            displayObj[subtopics[key].displayName || subtopics[key]] = true;
          }

          return displayObj;
        },
        {}
      );

      return subjects;
    }
  },
  methods: {
    onPhoneInputUpdate(phoneInputInfo) {
      this.phoneInputInfo = phoneInputInfo;
    },

    /**
     * Toggle editing state.
     * {Case A} if activeEdit === false: enter the editing state by setting activeEdit to true
     * {Case B} if activeEdit === true: save profile changes & exit the editing state by setting activeEdit to false
     */
    editProfile() {
      // {Case A} Enter the editing state, then early exit
      if (!this.activeEdit) {
        this.editBtnMsg = "Save";
        this.activeEdit = true;
        return;
      }

      // {Case B} The remainder of this function saves new changes and exits the editing state

      // Start by erasing previous errors
      this.errors = [];
      this.invalidInputs = [];
      this.saveFailed = false;

      // Validate fields
      if (this.user.isVolunteer) {
        // volunteers must provide a phone number, so display error message and
        // mark field invalid
        if (
          this.user.phone &&
          (!this.phoneInputInfo.isValid || !this.phoneInputInfo.e164)
        ) {
          this.errors.push("Please enter a valid phone number.");
          this.invalidInputs.push("phone");
        }
      }

      if (!this.errors.length) {
        // form fields valid, so set profile
        this.user.phone = this.phoneInputInfo.e164;

        // send only the necessary data
        const payloadUser = {};
        const keys = ["phone"];

        keys.forEach(key => (payloadUser[key] = this.user[key]));

        // wait for save to succeed before coming out of edit mode
        UserService.setProfile(payloadUser).then(
          () => {
            this.editBtnMsg = "Edit";
            this.activeEdit = false;
            this.saveFailed = false;
          },
          () => {
            this.saveFailed = true;
          }
        );
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.profile {
  font-size: 16px;
  font-family: $font-family-default;
}

.wrap-container {
  padding: 15px 15px 55px 15px;
  @include flex-container(column);
  align-items: stretch;

  @include child-spacing(top, 16px);
  @include child-spacing(right, 0);

  @include breakpoint-above("large") {
    padding: 40px;

    @include child-spacing(top, 0);
    @include child-spacing(right, 40px);

    @include flex-container(row);

    & > * {
      flex-basis: 50%;
    }
  }
}

.header {
  display: flex;
  margin: 0;
  font-size: 24px;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  padding: 25px 15px 10px 35px;

  @include breakpoint-above("large") {
    padding: 40px 40px 0 40px;
  }
}

.contain {
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  background: #fff;
}

.container-content {
  padding: 20px;
  text-align: left;

  @include breakpoint-above("large") {
    padding: 40px;
  }
}

.subheader {
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px 15px 0;
  font-size: 20px;
}

.container-section {
  display: flex;
  flex-direction: column;
  margin-bottom: 20px;
}

ul {
  padding: 0px;
  height: 100%;
  margin: auto;
}

.basic-info {
  display: flex;
  flex-direction: column;
  align-items: left;
  margin-top: 30px;
}

.info-header {
  display: flex;
  align-items: center;

  margin-left: 30px;
  font-size: 20px;
  font-weight: 600;
}

.info-header.basic {
  height: 60px;
}

.info-header.cert {
  margin-bottom: 15px;
}

.answer {
  font-weight: 600;
}

.answer ul {
  margin-left: 20px;
}

.phone-input {
  margin: 5px 0 0;
}

.description {
  margin-top: 10px;
  font-size: 12px;
}

button {
  height: 30px;
  border-radius: 20px;
  padding: 0px 10px;
  color: #16d2aa;
  background-color: #f6f6f6;
}

button:active,
button:hover {
  background-color: #16d2aa;
  color: #fff;
}

.editBtn {
  background-color: #16d2aa;
  border-radius: 30px;
  width: 120px;
  align-items: center;
  height: 40px;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;

  &:hover {
    color: #2c3e50;
  }
}

.form-control {
  border: none;
  box-shadow: none;
  border-radius: 0;
  background-color: #f0f8fd;
}

.form-control {
  border-bottom: 3px solid #16d2aa;
  margin-bottom: 10px;

  &.invalid {
    border-bottom: 3px solid #bf0000;
  }
}

.form-control:focus {
  border-bottom: 3px solid #16d2aa;
  box-shadow: none;
}

.resetBtn {
  padding: 20px 0 5px;
  a {
    color: darken($c-error-red, 25%);

    &:hover {
      text-decoration: none;
      color: darken($c-error-red, 40%);
    }
  }
}

.container-content.cert {
  padding: 30px 0 0;
}

.certBox {
  display: flex;
  height: 60px;
  align-items: center;
  padding-left: 20px;
  border-top: 1px solid #cccccf;
  font-weight: 600;
}

.certKey {
  border-radius: 12px;
  padding: 0 10px;
  margin: 0 10px 0 0;
  color: #ffffff;
  font-size: 12px;
  background-color: #1855d1;
}

.COLLEGE {
  background-color: #f1c026;
}

.MATH {
  background-color: #16d2aa;
}

.SCIENCE {
  background-color: #9675ce;
}

.errors {
  text-align: left;
  padding: 30px;
}

.errors-heading {
  color: #bf0000;
}

.errors-list {
  color: #bf0000;
  margin-left: 40px;
}
</style>
