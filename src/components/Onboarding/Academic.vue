<template>
  <div class="profile-editor">
    <div class="profile-header">
        <h2>{{user.isVolunteer ? 'Volunteer' : 'Student' }} Profile</h2>
    </div>

    <button class="btn btn-lg btn-primary btn-block skip" @click.prevent="skipOnboarding">Skip this step for now</button>

    <div class="alert alert-danger" role="alert" v-if="error">{{error}}</div>

    <div class="row form-group">
      <p>Current high school</p>

      <div class="row">
        <div class="col-sm-12">
          <input type="text" v-model="user.highschool" class="form-control" required autofocus>
        </div>
      </div>
    </div>

    <div class="row form-group">
      <p>Current grade</p>
      <div class="row">
        <div class="col-sm-6">
          <select class="form-control" v-model="user.currentGrade">
            <option></option>
            <option>Freshman</option>
            <option>Sophomore</option>
            <option>Junior</option>
            <option>Senior</option>
          </select>
        </div>
      </div>
    </div>

    <div class="row form-group">
      <p>Expected high school graduation</p>
      <div class="row">
        <div class="col-sm-6">
          <select class="form-control" v-model="user.expectedGraduation">
            <option></option>
            <option>2017</option>
            <option>2018</option>
            <option>2019</option>
            <option>2020</option>
            <option>2021</option>
            <option>2022</option>
          </select>
        </div>
      </div>
    </div>

    <div class="row form-group">
      <p>Which academic subject do you find most difficult?</p>

      <div class="row">
        <div class="col-sm-12">
          <input type="text" v-model="user.difficultAcademicSubject" class="form-control">
        </div>
      </div>
    </div>

    <div class="row form-group">
      <p>Which part of the college application process do you find most difficult?</p>
      <div class="row">
        <div class="col-sm-6">
          <div class="checkbox">
            <label>
              <input type="checkbox" value="PersonalStatement" v-model="user.difficultCollegeProcess">
              Personal Statement / Essay
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="Resume" v-model="user.difficultCollegeProcess">
              Resume
            </label>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="checkbox">
            <label>
              <input type="checkbox" value="Exams" v-model="user.difficultCollegeProcess">
              SAT / ACT Exams
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="ChoosingSchools" v-model="user.difficultCollegeProcess">
              Choosing which schools to apply to
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="row form-group">
      <p>What is the highest level of education completed by one of your parents?</p>
      <div class="row">
        <div class="col-sm-12">
          <div class="checkbox">
            <label>
              <input type="checkbox" value="SomeHighSchool" v-model="user.highestLevelEducation">
              Some high school
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="HighSchoolGED" v-model="user.highestLevelEducation">
              High school/GED degree
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="SomeCollege" v-model="user.highestLevelEducation">
              Some college
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="AssociatesDegree" v-model="user.highestLevelEducation">
              Associate's degree
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="BachelorsDegree" v-model="user.highestLevelEducation">
              Bachelor's degree
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="MastersDegreeHigher" v-model="user.highestLevelEducation">
              Master’s degree or higher
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="NotSure" v-model="user.highestLevelEducation">
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
          <select class="form-control" v-model="user.hasGuidanceCounselor">
            <option></option>
            <option>Yes</option>
            <option>No</option>
            <option>I don't know</option>
          </select>
        </div>
      </div>
    </div>

    <button class="btn btn-lg btn-primary btn-block back" @click.prevent="back">Back</button>
    <button class="btn btn-lg btn-primary btn-block next" type="submit" @click.prevent="submitProfile">{{buttonMsg}}</button>
  </div>
</template>

<script>

import UserService from 'src/services/UserService'
import OnboardingService from 'src/services/OnboardingService'

export default {
  data() {
    var user = UserService.getUser();
    return {
      user: user,
      buttonMsg: 'Next',
      error: ''
    }
  },
  methods: {
    skipOnboarding(){
      this.$router.push('/');
    },
    back(){
      this.$router.push('/onboarding/profile');
    },
    submitProfile(e){
      this.buttonMsg = 'Updating...';
      console.log(this.user);
      UserService.setProfile(this, this.user, '/onboarding/college');
    }
  }
}
</script>

<style scoped>
.profile-header {
  height: 100px;
  margin: 0;
  background-color: #1855D1;
  padding-left: 30px;
  margin-bottom: 50px;
}

h2 {
  color: white;
  font-size: 24px;
  text-align: left;
  font-weight: 600;
  line-height: 100px;
  margin: 0;
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
  margin-bottom: 50px;
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
  color: #73737A;
}

label {
  display: block;
  text-align: left;
  font-size: 12px;
  font-weight: 300;
  color: #343440;
}

.form-control {
  border-bottom: 3px solid black;
  margin-bottom: 10px;
}

.form-control:focus {
  border-bottom: 3px solid black;
  box-shadow: none;
}

.checkbox label {
  font-size: 16px;
}

select.form-control, select.form-control:focus {
  border-bottom: 0;
  border: 1px solid #979797;
}

.btn {
  width: 190px;
  background-color: #16D2AA;
  border: none;
  font-weight: 600;
  margin-left: 50px;
}

.btn.skip {
  width: 250px;
  margin: 0 auto;
}

.btn.back {
  float: left;
}

.btn.next {
  float: right;
  margin-right: 50px;
}
</style>
