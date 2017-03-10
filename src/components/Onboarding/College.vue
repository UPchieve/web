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

    <div class="row form-group">
      <p>Which services are you interested in? (Select all that apply)</p>
      <div class="checkbox">
        <label>
          <input type="checkbox" value="Math" v-model="checkedServices">
          Math Tutoring
        </label>
      </div>
      <div class="checkbox">
        <label>
          <input type="checkbox" value="College" v-model="checkedServices">
          College Counseling
        </label>
      </div>
    </div>

    <div class="row form-group">
      <p>(Optional) Link to a profile picture</p>
      <div class="row">
        <div class="col-sm-6">
          <input type="url" v-model="user.picture" class="form-control url-box" id="profilePictureInput" placeholder="http://example.com/picture.jpg">
        </div>
      </div>
    </div>

    <div class="row form-group">
      <p>Your birthday</p>
      <div class="row">
        <div class="col-sm-6">
          <input type="text" v-model="birthdate" class="form-control" id="birthdayInput">
          <label for="birthdayInput">MM/DD/YYYY</label>
        </div>
      </div>
    </div>

    <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="submitProfile">{{buttonMsg}}</button>
  </div>
</template>

<script>

import UserService from 'src/services/UserService'
import OnboardingService from 'src/services/OnboardingService'

export default {
  data() {
    return {
      user: UserService.getUser(),
      birthdate: UserService.getBirthDate(),
      checkedServices: UserService.getOnboardingServiceInterest(),
      buttonMsg: 'Next',
      error: ''
    }
  },
  methods: {
    submitProfile(e){
      this.error = ''

      if (!UserService.setBirthDate(this.birthdate)){
        this.error = 'Could not set birhtday';
        return;
      }

      this.user.onboardingServiceInterest = this.checkedServices;

      this.buttonMsg = 'Updating...';
      UserService.setProfile(this, this.user, OnboardingService.isOnboarded() ? null : '/')
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


.form-signin .form-control:focus {
  z-index: 2;
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

button[type="submit"] {
  width: 190px;
  background-color: #16D2AA;
  border: none;
  font-weight: 600;
  margin-left: 50px;
}
</style>
