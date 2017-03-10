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

    <button class="btn btn-lg btn-primary btn-block back" @click.prevent="back">Back</button>
    <button class="btn btn-lg btn-primary btn-block next" type="submit" @click.prevent="submit">{{buttonMsg}}</button>
  </div>
</template>

<script>

import UserService from 'src/services/UserService'
import OnboardingService from 'src/services/OnboardingService'

export default {
  data() {
    return {
      user: UserService.getUser(),
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
