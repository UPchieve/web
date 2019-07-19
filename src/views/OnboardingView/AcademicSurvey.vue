<template>
  <div class="profile-editor">
    <div class="header">
      <h2>Registration: First Time Use Survey</h2>
    </div>
    <div class="registration-body">
      <div class="description">
        Before you can request a tutor, we request that you fill out this short
        survey so that we can continue to improve our services. You will not be
        asked to take this again.
      </div>

      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <ul v-if="!user.isVolunteer" class="row form-group">
        <p>
          Do you identify with any of the following minority groups? (Please
          select all that apply.)
        </p>
        <div class="option-container">
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="LGBTQ"
              />
              LGBTQ
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="LearningDisability"
              />
              Learning disabilities
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="OtherDisability"
              />
              Other disabilities
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="Immigrant"
              />
              Immigrant
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="Homeless"
              />
              Homeless
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="FreeLunch"
              />
              Free or reduced price lunch
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="LowIncome"
              />
              Low-income
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="SingleParent"
              />
              Single-parent household
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="PublicHousing"
              />
              NYCHA (public housing) resident
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.groupIdentification"
                type="checkbox"
                value="None"
              />
              None of the above
            </label>
          </div>
        </div>
      </ul>

      <ul v-if="!user.isVolunteer" class="row form-group">
        <p>
          Do you have access to a computer or phone with internet access?
          (Please select all that apply.)
        </p>
        <div class="row">
          <div class="col-sm-12">
            <div class="checkbox">
              <label>
                <input
                  v-model="user.computerAccess"
                  type="checkbox"
                  value="HomeInternet"
                />
                My home has a computer with internet access
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.computerAccess"
                  type="checkbox"
                  value="PhoneInternet"
                />
                I have my own smartphone with internet access
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.computerAccess"
                  type="checkbox"
                  value="FamilyPhone"
                />
                Someone who lives with me has a smartphone with internet access
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.computerAccess"
                  type="checkbox"
                  value="None"
                />
                None
              </label>
            </div>
          </div>
        </div>
      </ul>

      <div class="row form-group">
        <p>Where/How are you currently accessing the internet?</p>
        <div class="row">
          <div class="col-sm-6">
            <select v-model="user.computerAccessLocation" class="form-control">
              <option />
              <option>School’s computer lab/library</option>
              <option>Public library</option>
              <option>Community center</option>
              <option>Shelter</option>
              <option>Using a friend’s computer or smartphone</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      <div class="row form-group">
        <p>At what time do you usually do your homework?</p>
        <div class="row">
          <div class="col-sm-6">
            <select v-model="user.homeworkTime" class="form-control">
              <option />
              <option>In the morning before school</option>
              <option>During school</option>
              <option>After school (2-5pm)</option>
              <option>Early evening (5-9pm)</option>
              <option>Late evening (after 9pm)</option>
            </select>
          </div>
        </div>
      </div>

      <div class="row form-group">
        <p>Which academic subject do you find most difficult?</p>
        <div class="row">
          <div class="col-sm-12">
            <input
              v-model="user.difficultAcademicSubject"
              type="text"
              class="form-control"
            />
          </div>
        </div>
      </div>

      <div class="row form-group">
        <p>
          What is your current GPA? Please fill out on a 4.0 scale if possible.
        </p>
        <div class="row">
          <div class="col-sm-12">
            <input v-model="user.gpa" type="text" class="form-control" />
          </div>
        </div>
      </div>

      <div class="row form-group">
        <p>
          Which part of the college application process do you find most
          difficult?
        </p>
        <div class="row">
          <div class="col-sm-6">
            <div class="checkbox">
              <label>
                <input
                  v-model="user.difficultCollegeProcess"
                  type="checkbox"
                  value="PersonalStatement"
                />
                Personal Statement / Essay
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.difficultCollegeProcess"
                  type="checkbox"
                  value="Resume"
                />
                Resume
              </label>
            </div>
          </div>

          <div class="col-sm-6">
            <div class="checkbox">
              <label>
                <input
                  v-model="user.difficultCollegeProcess"
                  type="checkbox"
                  value="Exams"
                />
                SAT / ACT Exams
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.difficultCollegeProcess"
                  type="checkbox"
                  value="ChoosingSchools"
                />
                Choosing which schools to apply to
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.difficultCollegeProcess"
                  type="checkbox"
                  value="Other"
                />
                Other
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="row form-group">
        <p>
          What is the highest level of education completed by one of your
          parents?
        </p>
        <div class="row">
          <div class="col-sm-12">
            <div class="checkbox">
              <label>
                <input
                  v-model="user.highestLevelEducation"
                  type="checkbox"
                  value="SomeHighSchool"
                />
                Some high school
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.highestLevelEducation"
                  type="checkbox"
                  value="HighSchoolGED"
                />
                High school/GED degree
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.highestLevelEducation"
                  type="checkbox"
                  value="SomeCollege"
                />
                Some college
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.highestLevelEducation"
                  type="checkbox"
                  value="AssociatesDegree"
                />
                Associate's degree
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.highestLevelEducation"
                  type="checkbox"
                  value="BachelorsDegree"
                />
                Bachelor's degree
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.highestLevelEducation"
                  type="checkbox"
                  value="MastersDegreeHigher"
                />
                Master’s degree or higher
              </label>
            </div>
            <div class="checkbox">
              <label>
                <input
                  v-model="user.highestLevelEducation"
                  type="checkbox"
                  value="NotSure"
                />
                Not sure
              </label>
            </div>
          </div>
        </div>
      </div>

      <div class="row form-group">
        <p>Does your high school have a college guidance counselor?</p>
        <div class="row">
          <div class="col-sm-6">
            <select v-model="user.hasGuidanceCounselor" class="form-control">
              <option />
              <option>Yes</option>
              <option>No</option>
              <option>I don't know</option>
            </select>
          </div>
        </div>
      </div>

      <div class="row form-group">
        <p>How did you hear about UPchieve?</p>
        <div class="row">
          <div class="col-sm-6">
            <select v-model="user.heardFrom" class="form-control">
              <option />
              <option>Flyer</option>
              <option>Email</option>
              <option>Friend</option>
              <option>Family</option>
              <option>Teacher</option>
              <option>Mentor</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>

      <div class="btn-container">
        <button
          class="btn btn-lg btn-primary btn-block back"
          type="back"
          @click.prevent="back"
        >
          BACK
        </button>
        <button
          class="btn btn-lg btn-primary btn-block next"
          type="submit"
          @click.prevent="submitProfile"
        >
          {{ buttonMsg }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import UserService from "@/services/UserService";
import $ from "jquery";

export default {
  data() {
    const user = UserService.getUser();
    return {
      user,
      buttonMsg: "DONE",
      error: ""
    };
  },
  methods: {
    skipOnboarding() {
      this.$router.push("/");
    },
    back() {
      this.$router.push("/onboarding/profile");
    },
    submitProfile() {
      this.error = "";

      if (!this.user.isVolunteer) {
        if (!this.user.groupIdentification.length) {
          this.error =
            'If you don\'t identify with any of the groups, please select "None of the Above"';
        } else if (!this.user.computerAccess.length) {
          this.error =
            'If you don\'t have access to a computer or phone with internet access, please select "None"';
        } else if (
          !this.user.computerAccessLocation ||
          this.user.computerAccessLocation === ""
        ) {
          this.error = "Please provide where you are accessing this site from";
        } else if (!this.user.homeworkTime || this.user.homeworkTime === "") {
          this.error =
            "Please provide the times times you generally do your homework";
        } else if (
          !this.user.difficultAcademicSubject ||
          this.user.difficultAcademicSubject === ""
        ) {
          this.error =
            "Please provide the academic subjects you find most difficult";
        } else if (!this.user.gpa || this.user.gpa === "") {
          this.error = "Please provide your GPA";
        } else if (!this.user.difficultCollegeProcess.length) {
          this.error =
            "Please provide the aspects of the college process that are most difficult";
        } else if (!this.user.highestLevelEducation.length) {
          this.error =
            "Please provide your parent's highest level of education";
        } else if (
          !this.user.hasGuidanceCounselor ||
          this.user.hasGuidanceCounselor === ""
        ) {
          this.error =
            "Please provide whether or not you have a guidance counselor";
        } else if (!this.user.heardFrom || this.user.heardFrom === "") {
          this.error = "Please provide where you heard about UPchieve";
        }
      }

      if (this.error !== "") {
        $("body").animate({ scrollTop: 0 });
        return;
      }

      this.buttonMsg = "Updating...";
      UserService.setProfile(this, this.user, "/");
    }
  }
};
</script>

<style lang="scss" scoped>
.header {
  height: 100px;
  margin: 0;
  padding-left: 30px;
  margin-bottom: 40px;
  display: flex;
  padding: 30px 0 30px 50px;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  background-color: #ffffff;
}

h2 {
  color: #343440;
  font-size: 24px;
  text-align: left;
  font-weight: 600;
  line-height: 100px;
  margin: 0;
  min-width: 500px;
}

.description {
  font-size: 16px;
  max-width: 650px;
  text-align: left;
  padding: 0px 50px 30px;
}

p {
  text-align: left;
  font-size: 16px;
  font-weight: 400;
  color: #343440;
}

.form-group {
  margin: 0;
  padding-left: 50px;
  max-width: 650px;
  margin-bottom: 30px;
}

.form-control {
  border: none;
  box-shadow: none;
  border-radius: 0;
}

.form-control.url-box {
  height: 40px;
  border: 1px solid #979797;
  font-weight: 300;
}

.form-control.url-box:focus {
  border: 1px solid #979797;
}

.form-control.url-box::placeholder {
  color: #73737a;
}

label {
  display: block;
  text-align: left;
  font-size: 12px;
  font-weight: 300;
  color: #343440;
}

.form-control {
  border-bottom: 3px solid #16d2aa;
  margin-bottom: 10px;
}

.form-control:focus {
  border-bottom: 3px solid #16d2aa;
  box-shadow: none;
}

.checkbox label {
  font-size: 16px;
}

select.form-control,
select.form-control:focus {
  border-bottom: 0;
  border: 1px solid #16d2aa;
}

button[type="submit"],
button[type="back"] {
  width: 140px;
  height: 40px;
  background-color: #f6f6f6;
  color: #16d2aa;
  border: none;
  font-weight: 600;
  margin: 0 50px 50px 50px;
  border-radius: 20px;
  font-size: 12px;
  float: right;
}

button[type="submit"]:hover,
button[type="submit"]:active,
button[type="back"]:hover,
button[type="back"]:active {
  background-color: #16d2aa;
  color: #fff;
}

.btn-container {
  max-width: 650px;
  display: flex;
  justify-content: space-between;
}

.profile-editor {
  display: flex;
  flex-direction: column;
  background-color: #e3f2fd;
}

.registration-body {
  padding-top: 50px;
  width: 620px;
  align-self: center;
  background-color: #ffffff;
  border-left: 5px solid #1855d1;
}

@media screen and (max-width: 700px) {
  .header {
    height: auto !important;
  }

  h2 {
    min-width: 1px !important;
    line-height: 1.2 !important;
  }

  .registration-body {
    width: 100% !important;
  }

  .form-group {
    padding: 0em 2em !important;
  }
}
</style>
