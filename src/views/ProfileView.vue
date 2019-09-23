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
            Please correct the following problem<span v-if="errors.length > 1"
              >s</span
            >
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
              <div v-show="!activeEdit" class="answer">
                {{ user.phonePretty }}
              </div>
              <div v-show="!user.phone && !activeEdit" class="answer">
                (None given)
              </div>
              <input
                v-show="activeEdit"
                v-model="user.phonePretty"
                type="text"
                class="form-control"
                :class="{ invalid: invalidInputs.indexOf('phone') > -1 }"
              />

              <div class="description">
                We will use this number to send you notifications when a student
                needs help. You will only receive notifications during the
                periods that you select in your schedule.
              </div>
            </div>

            <div id="college" class="container-section">
              <div class="prompt">Your College</div>
              <div v-show="!activeEdit" class="answer">{{ user.college }}</div>
              <div v-show="!user.college && !activeEdit" class="answer">
                (None given)
              </div>
              <input
                v-show="activeEdit"
                v-model="user.college"
                type="text"
                class="form-control"
                :class="{ invalid: invalidInputs.indexOf('college') > -1 }"
              />
            </div>

            <div id="favoriteAcademicSubject" class="container-section">
              <div class="prompt">Your Favorite Academic Subject</div>
              <div v-show="!activeEdit" class="answer">
                {{ user.favoriteAcademicSubject }}
              </div>
              <div
                v-show="!user.favoriteAcademicSubject && !activeEdit"
                class="answer"
              >
                (None given)
              </div>
              <input
                v-show="activeEdit"
                v-model="user.favoriteAcademicSubject"
                type="text"
                class="form-control"
                :class="{
                  invalid: invalidInputs.indexOf('favoriteAcademicSubject') > -1
                }"
              />
            </div>
          </div>

          <div class="container-section resetBtn">
            <router-link to="resetpassword" class="prompt"
              >Reset password</router-link
            >
          </div>
        </div>
      </div>

      <div v-if="user.isVolunteer" class="cert-info contain">
        <div class="subheader">Certifications and Tutoring Topics</div>
        <div class="container-content cert">
          <div
            v-for="(value, key) in certifications"
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

      <div v-if="false" class="profile-pic contain">
        <div class="subheader">Profile Picture</div>
        <div class="container-content">
          <div id="profilePic" class="container-section">
            <div :style="avatarStyle" class="answer avatar" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserService from "@/services/UserService";
import phoneValidation from "@/utils/phone-validation";
import StudentAvatarUrl from "@/assets/defaultavatar3.png";
import VolunteerAvatarUrl from "@/assets/defaultavatar4.png";

export default {
  data() {
    return {
        user: {},
        activeEdit: false,
        editBtnMsg: "Edit",
        name: "Loading",
        avatarStyle: {
          backgroundImage: "none"
        },
        certifications: {},
        certKey: {},
        errors: [],
        invalidInputs: [],
        saveFailed: false
      };
  },
  created() {
    UserService.getUser().then(user => {
      const avatarUrl =
        user.picture ||
        (user.isVolunteer ? VolunteerAvatarUrl : StudentAvatarUrl);
  
      const certifications = {};
      if (user.algebra) {
        if (user.algebra.passed) {
          certifications.Algebra = true;
        }
      }
      if (user.geometry) {
        if (user.geometry.passed) {
          certifications.Geometry = true;
        }
      }
      if (user.trigonometry) {
        if (user.trigonometry.passed) {
          certifications.Trigonometry = true;
        }
      }
      if (user.precalculus) {
        if (user.precalculus.passed) {
          certifications.Precalculus = true;
        }
      }
      if (user.calculus) {
        if (user.calculus.passed) {
          certifications.Calculus = true;
        }
      }
      if (user.esl) {
        if (user.esl.passed) {
          certifications.ESL = true;
        }
      }
      if (user.planning) {
        if (user.planning.passed) {
          certifications.Planning = true;
        }
      }
      if (user.essays) {
        if (user.essays.passed) {
          certifications.Essays = true;
        }
      }
      if (user.applications) {
        if (user.applications.passed) {
          certifications.Applications = true;
        }
      }
  
      const certKey = {};
      certKey.Algebra = "MATH";
      certKey.Geometry = "MATH";
      certKey.Trigonometry = "MATH";
      certKey.Precalculus = "MATH";
      certKey.Calculus = "MATH";
      certKey.ESL = "ESL";
      certKey.Planning = "COLLEGE";
      certKey.Essays = "COLLEGE";
      certKey.Applications = "COLLEGE";
  
      this.user = user;
      this.name = user.firstname || (user.isVolunteer ? "volunteer" : "student");
      this.avatarStyle.backgroundImage = `url(${avatarUrl})`;
      this.certifications = certifications;
      this.certKey = certKey;
    });
  },
  methods: {
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
          !this.user.phonePretty ||
          !phoneValidation.validatePhoneNumber(this.user.phonePretty)
        ) {
          this.errors.push("Please enter a valid U. S. phone number.");
          this.invalidInputs.push("phone");
        }
        // a college name is required
        if (!this.user.college) {
          this.errors.push("Please tell us what college you go to.");
          this.invalidInputs.push("college");
        }
        // a favorite academic subject is required
        if (!this.user.favoriteAcademicSubject) {
          this.errors.push("Please tell us your favorite academic subject.");
          this.invalidInputs.push("favoriteAcademicSubject");
        }
      }

      if (!this.errors.length) {
        // form fields valid, so set profile
        // wait for save to succeed before coming out of edit mode
        UserService.setProfile(this, this.user).then(
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
  align-items: flex-start;
  margin-bottom: 20px;
}

ul {
  padding: 0px;
  height: 100%;
  margin: auto;
}

.difficultCollegeProcessAnswer {
  width: 400px;
  display: flex;
  align-items: left;
  margin-left: 150px;
  flex-direction: column;
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

.description {
  margin-top: 15px;
  font-size: 12px;
}

.avatar {
  display: block;
  width: 50px;
  height: 50px;
  background-size: cover;
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

.checkbox label {
  font-size: 16px;
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
}

.ESL {
  background-color: #1855d1;
}

.COLLEGE {
  background-color: #fed766;
}

.MATH {
  background-color: #f7aef8;
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
