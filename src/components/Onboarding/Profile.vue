<template>
  <div class="profile-editor">
    <div class="profile-header">
        <h2>{{user.isVolunteer ? 'Volunteer' : 'Student' }} Profile</h2>
    </div>

    <div class="alert alert-danger" role="alert" v-if="error">{{error}}</div>

    <div class="row form-group">
      <p>Your full name</p>

      <div class="row">
        <div class="col-sm-6">
          <input type="text" v-model="user.firstname" class="form-control" id="firstNameInput" required autofocus>
          <label for="firstNameInput">First name</label>
        </div>
        <div class="col-sm-6">
          <input type="text" v-model="user.lastname" class="form-control" id="lastNameInput">
          <label for="lastNameInput">Last name</label>
        </div>
      </div>
    </div>

    <ul class="row form-group" v-if="!user.isVolunteer">
        <p>Which services are you interested in? (Select all that apply)</p>
        <div class="checkbox">
          <label>
            <input type="checkbox" value="Math" v-model="user.serviceInterests">
            Math Tutoring
          </label>
        </div>
        <div class="checkbox">
          <label>
            <input type="checkbox" value="College" v-model="user.serviceInterests">
            College Counseling
          </label>
        </div>
    </ul>

    <div class="row form-group">
      <p>(Optional) Link to a profile picture</p>
      <div class="row">
        <div class="col-sm-6">
          <input type="url" v-model="user.picture" class="form-control url-box" id="profilePictureInput" placeholder="http://example.com/picture.jpg">
        </div>
      </div>
    </div>

    <ul class="row form-group" v-if="!user.isVolunteer">
      <p>Your birthday</p>
      <div class="row">
        <div class="col-sm-6">
          <input type="text" v-model="user.birthdate" class="form-control" id="birthdayInput">
          <label for="birthdayInput">MM/DD/YYYY</label>
        </div>
      </div>
    </ul>

    <ul class="row form-group" v-if="!user.isVolunteer">
      <p>Your gender</p>
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

    <ul class="row form-group" v-if="!user.isVolunteer">
      <p>Your race/ethnicity</p>
      <div class="row">
        <div class="col-sm-6">
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
        </div>
        <div class="col-sm-6">
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
        </div>
      </div>
    </ul>

    <ul class="row form-group" v-if="!user.isVolunteer">
      <p>Do you identify with any of the following groups?</p>
      <div class="row">
        <div class="col-sm-6">
          <div class="checkbox">
            <label>
              <input type="checkbox" value="LGBTQ" v-model="user.groupIdentification">
              LGBTQ
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="LearningDisability" v-model="user.groupIdentification">
              Learning disabilities
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="OtherDisability" v-model="user.groupIdentification">
              Other disabilities
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="Immigrant" v-model="user.groupIdentification">
              Immigrant
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="Homeless" v-model="user.groupIdentification">
              Homeless
            </label>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="checkbox">
            <label>
              <input type="checkbox" value="FreeLunch" v-model="user.groupIdentification">
              Free or reduced price lunch
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="LowIncome" v-model="user.groupIdentification">
              Low-income
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="SingleParent" v-model="user.groupIdentification">
              Single-parent household
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="PublicHousing" v-model="user.groupIdentification">
              NYCHA (public housing) resident
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="None" v-model="user.groupIdentification">
              None of the above
            </label>
          </div>
        </div>
      </div>
    </ul>

    <ul class="row form-group" v-if="!user.isVolunteer">
      <p>Do you have access to a computer or phone with internet access?</p>
      <div class="row">
        <div class="col-sm-12">
          <div class="checkbox">
            <label>
              <input type="checkbox" value="HomeInternet" v-model="user.computerAccess">
              My home has a computer with internet access
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="PhoneInternet" v-model="user.computerAccess">
              I have my own smartphone with internet access
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="FamilyPhone" v-model="user.computerAccess">
              Someone who lives with me has a smartphone with internet access
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="None" v-model="user.computerAccess">
              None
            </label>
          </div>
        </div>
      </div>
    </ul>

    <ul class="row form-group" v-if="!user.isVolunteer">
      <p>What time(s) do you prefer to use our services?</p>
      <div class="row">
        <div class="col-sm-6">
          <div class="checkbox">
            <label>
              <input type="checkbox" value="3-4" v-model="user.preferredTimes">
              3-4
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="4-5" v-model="user.preferredTimes">
              4-5
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="5-6" v-model="user.preferredTimes">
              5-6
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="6-7" v-model="user.preferredTimes">
              6-7
            </label>
          </div>
        </div>
        <div class="col-sm-6">
          <div class="checkbox">
            <label>
              <input type="checkbox" value="7-8" v-model="user.preferredTimes">
              7-8
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="8-9" v-model="user.preferredTimes">
              8-9
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="9-10" v-model="user.preferredTimes">
              9-10
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input type="checkbox" value="10-11" v-model="user.preferredTimes">
              10-11
            </label>
          </div>
        </div>
      </div>
    </ul>

    <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="submitProfile">{{buttonMsg}}</button>
  </div>
</template>

<script>

import $ from 'jquery'
import validator from 'validator'

import UserService from 'src/services/UserService'
import OnboardingService from 'src/services/OnboardingService'

export default {
  data() {
    var user = UserService.getUser();
    user.serviceInterests = user.serviceInterests || [];
    user.race = user.race || [];
    user.groupIdentification = user.groupIdentification || [];
    user.computerAccess = user.computerAccess || [];
    user.preferredTimes = user.preferredTimes || [];
    user.birthdate = user.birthdate || '';
    if (!user.isVolunteer) {
      var button = 'Next';
    } else {
      var button = 'Submit';
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
      var birthdateValidation = UserService.validateBirthdate();

      if (!user.isVolunteer) {
        if (!this.user.firstname || this.user.firstname === ''){
          this.error = 'Please provide your full name';
        } else if (!this.user.lastname || this.user.lastname === '') {
          this.error = 'Please provide your full name';
        } else if (!this.user.serviceInterests.length){
          this.error = 'Please indicate a service you are interested in';
        } else if (this.user.picture && !validator.isURL(this.user.picture)){
          this.error = 'Profile picture URL is invalid';
        } else if (!this.user.birthdate || this.user.birthdate === ''){
          this.error = 'Please provide your birthday'
        } else if (birthdateValidation !== true){
          this.error = birthdateValidation;
        } else if (!this.user.gender || this.user.gender === ''){
          this.error = 'Please select a gender';
        } else if (!this.user.race.length){
          this.error = 'Please select a race';
        } else if (!this.user.preferredTimes.length){
          this.error = 'Please selected a preferred time';
        } else if (!this.user.groupIdentification.length){
          this.error = 'If you don\'t identify with any of the groups, please select "None of the Above"' ;
        } else if (!this.user.computerAccess.length){
          this.error = 'If you don\'t have access to a computer or phone with internet access, please select "None"' ;
        }
      } else {
        if (!this.user.firstname || this.user.firstname === ''){
          this.error = 'Please provide your full name';
        } else if (!this.user.lastname || this.user.lastname === '') {
          this.error = 'Please provide your full name';
        }
      }

      if (this.error !== ''){
        $('body').animate({scrollTop: 0})
        return;
      }

      this.buttonMsg = 'Updating...';
      if (!user.isVolunteer) {
        UserService.setProfile(this, this.user, '/onboarding/academic')
      }
      else {
        UserService.setProfile(this, this.user, '/dashboard')
      }
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

button[type="submit"] {
  width: 190px;
  background-color: #16D2AA;
  border: none;
  font-weight: 600;
  margin-left: 50px;
}
</style>
