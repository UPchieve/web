<template>
  <div class="profile-editor">
    <div class="header">
      <h2>Registration: Basic Profile</h2>
    </div>

    <div class="registration-body">
      <div v-if="error" class="alert alert-danger" role="alert">
        {{ error }}
      </div>

      <div class="row form-group">
        <p>Your Name</p>

        <div class="row">
          <div class="col-sm-6">
            <input
              id="firstNameInput"
              v-model="user.firstname"
              type="text"
              class="form-control"
              required
              autofocus
            />
            <label for="firstNameInput">First</label>
          </div>
          <div class="col-sm-6">
            <input
              id="lastNameInput"
              v-model="user.lastname"
              type="text"
              class="form-control"
            />
            <label for="lastNameInput">Last</label>
          </div>

          <div class="col-sm-6">
            <input
              id="nicknameInput"
              v-model="user.nickname"
              type="text"
              class="form-control"
              required
              autofocus
            />
            <label for="nicknameInput">Nickname</label>
          </div>
        </div>
      </div>

      <ul class="row form-group">
        <p>Your Birthday</p>
        <div class="row">
          <div class="col-sm-6">
            <input
              id="birthdayInput"
              v-model="user.birthdate"
              type="text"
              class="form-control"
            />
            <label for="birthdayInput">MM/DD/YYYY</label>
          </div>
        </div>
      </ul>

      <ul class="row form-group">
        <p>Your Gender</p>
        <div class="row">
          <div class="col-sm-6">
            <select v-model="user.gender" class="form-control">
              <option />
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
              <input
                v-model="user.race"
                type="checkbox"
                value="HispanicOrLatino"
              />
              Hispanic or Latino
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input v-model="user.race" type="checkbox" value="White" />
              White
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input v-model="user.race" type="checkbox" value="Black" />
              Black / African American
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.race"
                type="checkbox"
                value="AmericanIndian"
              />
              American Indian / Alaskan Native
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input v-model="user.race" type="checkbox" value="Asian" />
              Asian
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input
                v-model="user.race"
                type="checkbox"
                value="PacificIslander"
              />
              Native Hawaiian / Other Pacific Islander
            </label>
          </div>
          <div class="checkbox">
            <label>
              <input v-model="user.race" type="checkbox" value="Other" />
              Other
            </label>
          </div>
        </div>
      </ul>

      <div v-if="!user.isVolunteer" class="row form-group">
        <p>Current high school</p>
        <div class="row">
          <div class="col-sm-12">
            <input
              v-model="user.highschool"
              type="text"
              class="form-control"
              required
              autofocus
            />
          </div>
        </div>
      </div>

      <div class="row form-group" v-if="!user.isVolunteer">
        <p>Current high school</p>
        <div class="row">
          <div class="col-sm-12">
            <autocomplete-input
              :parentModel="user.highschool"
            ></autocomplete-input>
          </div>
        </div>
      </div>

      <div v-if="!user.isVolunteer" class="row form-group">
        <p>Expected High School Graduation</p>
        <div class="row">
          <div class="col-sm-6">
            <select v-model="user.expectedGraduation" class="form-control">
              <option />
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

      <div v-if="!user.isVolunteer" class="row form-group">
        <p>Were you referred by one of our partner organizations?</p>
        <div class="row">
          <div class="col-sm-6">
            <select v-model="user.referred" class="form-control">
              <option />
              <option>Yes - Oasis</option>
              <option>Yes - Big Brothers Big Sisters</option>
              <option>No</option>
            </select>
          </div>
        </div>
      </div>

      <div v-if="user.isVolunteer" class="row form-group">
        <p>Your Phone Number</p>
        <div class="row">
          <div class="col-sm-12">
            <input
              v-model="user.phone"
              type="text"
              class="form-control"
              required
              autofocus
            />
          </div>
        </div>
        <label
          >We will use this number to send you notifications when a student
          needs help. You will only receive notifications during the periods
          that you select in your schedule.</label
        >
      </div>

      <div v-if="user.isVolunteer" class="row form-group">
        <p>Your College</p>
        <div class="row">
          <div class="col-sm-12">
            <input
              v-model="user.college"
              type="text"
              class="form-control"
              required
              autofocus
            />
          </div>
        </div>
      </div>

      <div v-if="user.isVolunteer" class="row form-group">
        <p>Your Favorite Academic Subject</p>
        <div class="row">
          <div class="col-sm-12">
            <input
              v-model="user.favoriteAcademicSubject"
              type="text"
              class="form-control"
              required
              autofocus
            />
          </div>
        </div>
      </div>

      <div v-if="user.isVolunteer" class="row form-group">
        <p>Were you referred by one of our partner organizations?</p>
        <div class="row">
          <div class="col-sm-6">
            <select v-model="user.referred" class="form-control">
              <option />
              <option>Yes - APO Xi Alpha</option>
              <option>Yes - Alpha Gamma Iota</option>
              <option>No</option>
            </select>
          </div>
        </div>
      </div>
      <div class="btn-container">
        <button
          class="btn btn-lg btn-primary btn-block"
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
import $ from 'jquery'

import validator from 'validator'

import UserService from 'src/services/UserService'
import OnboardingService from 'src/services/OnboardingService'

import AutocompleteInput from './AutocompleteInput'

export default {
  components: {
    AutocompleteInput
  },
  data () {
    const user = UserService.getUser()
    let button
    user.race = user.race || []
    user.birthdate = user.birthdate || ''
    if (!user.isVolunteer) {
      button = 'NEXT'
    } else {
      button = 'DONE'
    }
    return {
      user,
      buttonMsg: button,
      error: ''
    }
  },
  methods: {
    submitProfile () {
      this.error = ''

      const user = UserService.getUser()
      const birthdateValidation = UserService.validateBirthdate(
        this.user.birthdate
      )

      if (!user.isVolunteer) {
        if (!this.user.firstname || this.user.firstname === '') {
          this.error = 'Please provide your full name'
        } else if (!this.user.lastname || this.user.lastname === '') {
          this.error = 'Please provide your full name'
        } else if (!this.user.birthdate || this.user.birthdate === '') {
          this.error = 'Please provide your birthday'
        } else if (birthdateValidation !== true) {
          this.error = birthdateValidation
        } else if (!this.user.gender || this.user.gender === '') {
          this.error = 'Please select a gender'
        } else if (!this.user.race.length) {
          this.error = 'Please select a race'
        } else if (!this.user.highschool || this.user.highschool === '') {
          this.error = 'Please provide the name of your high school'
        } else if (
          !this.user.expectedGraduation ||
          this.user.expectedGraduation === ''
        ) {
          this.error = 'Please provide your expected graduation year'
        } else if (!this.user.referred || this.user.referred === '') {
          this.error = 'Please provide your referral information'
        }
      } else if (!this.user.firstname || this.user.firstname === '') {
        this.error = 'Please provide your full name'
      } else if (!this.user.lastname || this.user.lastname === '') {
        this.error = 'Please provide your full name'
      } else if (!this.user.birthdate || this.user.birthdate === '') {
        this.error = 'Please provide your birthday'
      } else if (birthdateValidation !== true) {
        this.error = birthdateValidation
      } else if (!this.user.gender || this.user.gender === '') {
        this.error = 'Please select a gender'
      } else if (!this.user.race.length) {
        this.error = 'Please select a race'
      } else if (!this.user.phone || this.user.phone === '') {
        this.error = 'Please provide your phone number'
      } else if (!this.user.college || this.user.college === '') {
        this.error = 'Please provide your college'
      } else if (
        !this.user.favoriteAcademicSubject ||
        this.user.favoriteAcademicSubject === ''
      ) {
        this.error = 'Please provide your favorite academic subject'
      } else if (!this.user.referred.length) {
        this.error = 'Please provide your referral information'
      }

      if (this.error !== '') {
        $('body').animate({ scrollTop: 0 })
        return
      }

      this.buttonMsg = 'UPDATING...'
      if (!user.isVolunteer) {
        UserService.setProfile(this, this.user, '/onboarding/academic')
      } else {
        UserService.setProfile(this, this.user, '/')
      }
    }
  }
}
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

p {
  text-align: left;
  font-size: 16px;
  font-weight: 400;
  color: #343440;
}

.form-group {
  margin: 0;
  padding: 0 50px;
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
  border: 1px solid #16d2aa;
  font-weight: 300;
}

.form-control.url-box:focus {
  border: 1px solid #16d2aa;
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

button[type='submit'] {
  width: 140px;
  height: 40px;
  background-color: #f6f6f6;
  color: #16d2aa;
  border: none;
  font-weight: 600;
  margin: 0px 0px 50px;
  border-radius: 20px;
  font-size: 12px;
  float: right;
}

button[type='submit']:hover,
button[type='submit']:active {
  background-color: #16d2aa;
  color: #fff;
}

.btn-container {
  max-width: 600px;
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



@media screen and (max-width: 488px) {
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

  .btn-container {
    padding-right: 2em !important;
  }
}
</style>
