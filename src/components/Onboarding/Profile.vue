<template>
  <div class="profile-editor">
    <div class="header">
        <h2>Registration: Basic Profile</h2>
    </div>

    <div class="alert alert-danger" role="alert" v-if="error">{{error}}</div>

    <div class="row form-group">
      <p>Your Name</p>

      <div class="row">
        <div class="col-sm-6">
          <input type="text" v-model="user.firstname" class="form-control" id="firstNameInput" required autofocus>
          <label for="firstNameInput">First</label>
        </div>
        <div class="col-sm-6">
          <input type="text" v-model="user.lastname" class="form-control" id="lastNameInput">
          <label for="lastNameInput">Last</label>
        </div>

        <div class="col-sm-6">
          <input type="text" v-model="user.nickname" class="form-control" id="nicknameInput" required autofocus>
          <label for="nicknameInput">Nickname</label>
        </div>

      </div>
    </div>

    <ul class="row form-group">
      <p>Your Birthday</p>
      <div class="row">
        <div class="col-sm-6">
          <input type="text" v-model="user.birthdate" class="form-control" id="birthdayInput">
          <label for="birthdayInput">MM/DD/YYYY</label>
        </div>
      </div>
    </ul>

    <ul class="row form-group">
      <p>Your Gender</p>
      <div class="row">
        <div class="col-sm-6">
          <select class="form-control" v-model="user.gender">
            <option></option>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </div>
      </div>
    </ul>

    <ul class="row form-group">
      <p>Your Race/Ethnicity (Please select all that apply.)</p>
      <div class="race-container">
        <div class="checkbox">
          <label>
            <input type="checkbox" value="HispanicOrLatino" v-model="user.race">
            Hispanic or Latino
          </label>
        </div>
        <div class="checkbox">
          <label>
            <input type="checkbox" value="White" v-model="user.race">
            White
          </label>
        </div>
        <div class="checkbox">
          <label>
            <input type="checkbox" value="Black" v-model="user.race">
            Black / African American
          </label>
        </div>
        <div class="checkbox">
          <label>
            <input type="checkbox" value="AmericanIndian" v-model="user.race">
            American Indian / Alaskan Native
          </label>
        </div>
        <div class="checkbox">
          <label>
            <input type="checkbox" value="Asian" v-model="user.race">
            Asian
          </label>
        </div>
        <div class="checkbox">
          <label>
            <input type="checkbox" value="PacificIslander" v-model="user.race">
            Native Hawaiian / Other Pacific Islander
          </label>
        </div>
        <div class="checkbox">
          <label>
            <input type="checkbox" value="Other" v-model="user.race">
            Other
          </label>
        </div>
      </div>
    </ul>

    <div class="row form-group" v-if="!user.isVolunteer">
      <p>Current high school</p>
      <div class="row">
        <div class="col-sm-12">
          <input type="text" v-model="user.highschool" class="form-control" required autofocus>
          <div class="stufff">kdafhkjasdh</div>
        </div>
      </div>
    </div>

    <div class="row form-group" v-if="!user.isVolunteer">
      <p>Expected High School Graduation</p>
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

    <div class="row form-group" v-if="!user.isVolunteer">
      <p>Were you referred by one of our partner organizations?</p>
      <div class="row">
        <div class="col-sm-6">
          <select class="form-control" v-model="user.referred">
            <option></option>
            <option>Yes - Oasis</option>
            <option>Yes - Big Brothers Big Sisters</option>
            <option>No</option>
          </select>
        </div>
      </div>
    </div>

    <div class="row form-group" v-if="user.isVolunteer">
      <p>Your Phone Number</p>
      <div class="row">
          <div class="col-sm-12">
           <input type="text" v-model="user.phone" class="form-control" required autofocus>
        </div>
      </div>
      <label>We will use this number to send
      you notifications when a student needs help. You will only receive
      notifications during the periods that you select in your schedule.</label>
    </div>

    <div class="row form-group" v-if="user.isVolunteer">
      <p>Your College</p>
      <div class="row">
          <div class="col-sm-12">
           <input type="text" v-model="user.college" class="form-control" required autofocus>
        </div>
      </div>
    </div>

    <div class="row form-group" v-if="user.isVolunteer">
      <p>Your Favorite Academic Subject</p>
      <div class="row">
          <div class="col-sm-12">
           <input type="text" v-model="user.favoriteAcademicSubject" class="form-control" required autofocus>
        </div>
      </div>
    </div>

    <div class="row form-group" v-if="user.isVolunteer">
      <p>Were you referred by one of our partner organizations?</p>
      <div class="row">
        <div class="col-sm-6">
          <select class="form-control" v-model="user.referred">
            <option></option>
            <option>Yes - APO Xi Alpha</option>
            <option>Yes - Alpha Gamma Iota</option>
            <option>No</option>
          </select>
        </div>
      </div>
    </div>

    <div class="btn-container">
      <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="submitProfile">{{buttonMsg}}</button>
    </div>
  </div>
</template>


<script>
import $ from 'jquery';
import validator from 'validator';

import UserService from 'src/services/UserService';
import OnboardingService from 'src/services/OnboardingService';

export default {
  data() {
    var user = UserService.getUser();
    user.race = user.race || [];
    user.birthdate = user.birthdate || '';
    if (!user.isVolunteer) {
      var button = 'NEXT';
    } else {
      var button = 'DONE';
    }
    return {
      user: user,
      buttonMsg: button,
      error: ''
    }
  },
  methods: {
    submitProfile(e){
      this.error = ''

      var user = UserService.getUser()
      var birthdateValidation = UserService.validateBirthdate(this.user.birthdate);

      if (!user.isVolunteer) {
        if (!this.user.firstname || this.user.firstname === ''){
          this.error = 'Please provide your full name';
        } else if (!this.user.lastname || this.user.lastname === '') {
          this.error = 'Please provide your full name';
        } else if (!this.user.birthdate || this.user.birthdate === ''){
          this.error = 'Please provide your birthday'
        } else if (birthdateValidation !== true){
          this.error = birthdateValidation;
        } else if (!this.user.gender || this.user.gender === ''){
          this.error = 'Please select a gender';
        } else if (!this.user.race.length){
          this.error = 'Please select a race';
        } else if (!this.user.highschool || this.user.highschool === ''){
          this.error = 'Please provide the name of your high school';
        } else if (!this.user.expectedGraduation || this.user.expectedGraduation === ''){
          this.error = 'Please provide your expected graduation year';
        } else if (!this.user.referred || this.user.referred === ''){
          this.error = 'Please provide your referral information';
        }
      } else {
        if (!this.user.firstname || this.user.firstname === ''){
          this.error = 'Please provide your full name';
        } else if (!this.user.lastname || this.user.lastname === '') {
          this.error = 'Please provide your full name';
        } else if (!this.user.birthdate || this.user.birthdate === ''){
          this.error = 'Please provide your birthday'
        } else if (birthdateValidation !== true){
          this.error = birthdateValidation;
        } else if (!this.user.gender || this.user.gender === ''){
          this.error = 'Please select a gender';
        } else if (!this.user.race.length){
          this.error = 'Please select a race';
        } else if (!this.user.phone || this.user.phone === ''){
          this.error = 'Please provide your phone number';
        } else if (!this.user.college || this.user.college === ''){
          this.error = 'Please provide your college';
        } else if (!this.user.favoriteAcademicSubject || this.user.favoriteAcademicSubject === ''){
          this.error = 'Please provide your favorite academic subject';
        } else if (!this.user.referred.length){
          this.error = 'Please provide your referral information';
        }
      }

      if (this.error !== ''){
        $('body').animate({scrollTop: 0})
        return;
      }

      this.buttonMsg = 'UPDATING...';
      if (!user.isVolunteer) {
        UserService.setProfile(this, this.user, '/onboarding/academic')
      }
      else {
        UserService.setProfile(this, this.user, '/')
      }
    }
  }
}
</script>


<style scoped>
.header {
  height: 100px;
  margin: 0;
  padding-left: 30px;
  margin-bottom: 40px;
  display: flex;
  padding: 30px 0 30px 50px;
  font-size: 24px;
  border-bottom: 0.5px solid #CCCCCF;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
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
  border: 1px solid #16D2AA;
  font-weight: 300;
}

.form-control.url-box:focus {
  border: 1px solid #16D2AA;
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
  border-bottom: 3px solid #16D2AA;
  margin-bottom: 10px;
}

.form-control:focus {
  border-bottom: 3px solid #16D2AA;
  box-shadow: none;
}

.checkbox label {
  font-size: 16px;
}

select.form-control, select.form-control:focus {
  border-bottom: 0;
  border: 1px solid #16D2AA;
}

button[type="submit"] {
  width: 140px;
  height: 40px;
  background-color: #F6F6F6;
  color: #16D2AA;
  border: none;
  font-weight: 600;
  margin: 0px 0px 50px;
  border-radius: 20px;
  font-size: 12px;
  float: right;
}

button[type="submit"]:hover, button[type="submit"]:active {
  background-color: #16D2AA;
  color: #FFF;
}

.btn-container {
  max-width: 600px;
}

</style>
