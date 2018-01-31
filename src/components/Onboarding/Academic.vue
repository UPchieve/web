<template>
  <div class="profile-editor">
    <div class="profile-header">
        <h2>Registration: First Time Use Survey</h2>
    </div>
    <div class="description">Before you can request a tutor, we request that you
     fill out this short survey so that we can continue to improve our services.
     You will not be asked to take this again.</div>

    <div class="alert alert-danger" role="alert" v-if="error">{{error}}</div>

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

    <button class="btn btn-lg btn-primary btn-block back" @click.prevent="back">Back</button>
    <button class="btn btn-lg btn-primary btn-block next" type="submit" @click.prevent="submitProfile">{{buttonMsg}}</button>
  </div>
</template>

<script>

import UserService from 'src/services/UserService'
import OnboardingService from 'src/services/OnboardingService'
import $ from 'jquery'

export default {
  data() {
    var user = UserService.getUser();
    return {
      user: user,
      buttonMsg: 'Done',
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
      this.error = '';

      if (!this.user.isVolunteer) {
        if (!this.user.groupIdentification.length){
          this.error = 'If you don\'t identify with any of the groups, please select "None of the Above"' ;
        } else if (!this.user.computerAccess.length){
          this.error = 'If you don\'t have access to a computer or phone with internet access, please select "None"' ;
        }
      }

      if (this.error !== ''){
        $('body').animate({scrollTop: 0})
        return;
      }

      this.buttonMsg = 'Updating...';
      console.log(this.user);
      UserService.setProfile(this, this.user, '/');
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
