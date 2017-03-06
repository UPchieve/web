<template>
  <div>
    <div class="row">
      <div class="col-sm-12" style="background-color:rgba(24,85,209,.6); text-align:left; padding-left:50px;padding-bottom:20px">
        <h3 style="color:white"><strong>Student Profile</strong></h3>
      </div>
    </div>

    <div class="row">
      <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Your full name</p>
      </div>
      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-bottom:0px">
        <div class="col-sm-4">
          <input type="text" v-model="user.firstname" class="form-control" required autofocus>
        </div>
        <div class="col-sm-4" style="text-align:left; padding-left:35px;">
          <input type="text" v-model="user.lastname" class="form-control">
        </div>
      </div>
      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px">
          <p style="color:gray">First name</p>
        </div>
        <div class="col-sm-4" style="text-align:left; padding-left:35px;">
          <p style="color:gray">Last name</p>
        </div>
      </div>
    </div>

    <div class="row">
      <!-- <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Your birthday</p>
      </div>
      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-bottom:0px">
        <div class="col-sm-4">
          <input type="text" v-model="birthdate" class="form-control" required autofocus>
        </div>
      </div>

      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px">
          <p style="color:gray">MM/DD/YYYY</p>
        </div>
      </div> -->

      <!-- <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
        <p>Your gender</p>
      </div>
      <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-top:0px">
        <div class="col-sm-4" style="padding-top:0px">
          <select class="form-control" v-model="user">
            <option v-bind:value="{gender: male}">Male</option>
            <option v-bind:value="{gender: female}">Female</option>
            <option v-bind:value="{gender: other}">Other</option>
          </select>
        </div>
      </div> -->
    </div>

    <div class="col-sm-12" style="text-align:left; padding-left:50px;padding-top:40px">
      <p>Link to a profile picture</p>
    </div>

    <div class="col-sm-12" style="text-align:left; padding-left:35px;padding-bottom:0px">
      <div class="col-sm-6">
        <input type="text" v-model="user.picture" placeholder="URL" style="width:400px; height:40px" required autofocus>
      </div>
    </div>

    <div class="col-sm-12" style="padding-left:35px;padding-top:40px">
         <button class="btn btn-lg btn-primary btn-block" type="submit" @click.prevent="submitProfile">Finish</button>

      </div>

    <br />
    {{msg}}
  </div>
</template>

<script>

import UserService from '../services/UserService'
import OnboardingService from '../services/OnboardingService'

export default {
  data() {
    return {
      isOnboarding: this.$route.path.indexOf('/onboarding') === 0,
      user: UserService.getUser(),
      birthdate: UserService.getBirthDate(),
      msg: ''
    }
  },
  methods: {
    submitProfile(e){
      this.msg = ''

      console.log(this.user);


      this.msg = 'Sending...';
      UserService.setProfile(this, this.user, OnboardingService.isOnboarded() ? null : '/');
    }
  }
}
</script>

<style scoped>
h2 {
    font-size: 24px;
    text-align: left;
    font-weight: 600;
    margin-bottom: 50px;
  }

  .form-signin {
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 400px;
    padding: 15px;
    margin: auto;
  }
  .form-control {
    border: none;
    box-shadow: none;
    border-radius: 0;
  }


  .form-signin .form-control:focus {
    z-index: 2;
  }

  label {
    display: block;
    text-align: left;
    font-size: 16px;
    font-weight: 400;
    color: #343440;
  }
  .form-control {
    border-bottom: 3px solid black;
    margin-bottom: 50px;
  }

  .form-control:focus {
    border-bottom: 3px solid black;
    box-shadow: none;
  }

  button[type="submit"] {
    width: 190px;
    background-color: #16D2AA;
    border: none;
    font-weight: 600;
  }

  .help-text {
    margin-top: 58px;
    font-weight: 300;
    text-align: left;
  }

  .help-text a {
    color: #16D2AA;
    font-weight: 700;
  }
</style>
