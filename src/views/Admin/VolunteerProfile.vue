<template>
  <div class="volunteer-profile">
    <div class="header"> {{volunteer.firstname}}'s Profile
      <button
        class="editBtn btn"
        @click="editProfile(volunteer)">
        {{ editBtnMsg }}
      </button>
    </div>
    <div class = "wrap-container">
      <div class = "contain">
        <div v-if="errors.length" class="errors">
          <h4 class="errors-heading">Please correct the following problem
            <span v-if="errors.length > 1">s</span> before saving:</h4>
          <ul class="errors-list">
            <li v-for="error in errors" :key="error" >{{ error }}</li>
          </ul>
        </div>
        <div v-if="saveFailed" class="errors">
          <h4 class="errors-heading">Could not save data</h4>
        </div>
      </div>
      <div class="contain">
        <div class="subheader">{{volunteer.firstname}} {{volunteer.nickname 
          ? "\"" + volunteer.nickname + "\"": ''}} {{volunteer.lastname}} 
        </div>
        <div class="container-content" >
          <div class="basic-info-container">
            <div class = "info-subcontainer">
              
              <div id="firstname" class="container-section">
                <div class="prompt">Firstname</div>
                <div v-show="!activeEdit" class="answer">{{ volunteer.firstname }}</div>
                <div v-show="!volunteer.firstname && !activeEdit" class="answer">
                  (None given)
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.firstname"
                  type="text"
                  class="form-control" 
                  :class="{'invalid': invalidInputs.indexOf('firstname') > -1}"/>
              </div>

              <div id="lastname" class="container-section">
                <div class="prompt">Lastname</div>
                <div v-show="!activeEdit" class="answer">{{ volunteer.lastname }}</div>
                <div v-show="!volunteer.lastname && !activeEdit" class="answer">
                  (None given)
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.lastname"
                  type="text"
                  class="form-control" 
                  :class="{'invalid': invalidInputs.indexOf('lastname') > -1}"/>
              </div>

              <div id="nickname" class="container-section">
                <div class="prompt">Nickname</div>
                <div v-show="!activeEdit" class="answer">{{ volunteer.nickname}}</div>
                <div v-show="!volunteer.nickname && !activeEdit" class="answer">
                  (None given)
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.nickname"
                  type="text"
                  class="form-control"/>
              </div>

              <div id="ID" class="container-section">
                <div class="prompt">ID</div>
                <div class="answer">{{ volunteer._id }}</div>
                <div v-show="!volunteer._id" class="answer">
                  (None given)
                </div>
              </div>
            
              <div id="gender" class="container-section">
                <div class="prompt">Gender</div>
                <div v-show="!activeEdit" class="answer">{{ volunteer.gender}}</div>
                <div v-show="!volunteer.gender && !activeEdit" class="answer">
                  (None given)
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.gender"
                  type="text"
                  class="form-control"/>
              </div>

              <div id="birthdate" class="container-section">
                  <div class="prompt">Birthdate</div>
                  <div v-show="!activeEdit" class="answer">{{ volunteer.birthdate}}</div>
                  <div v-show="!volunteer.birthdate && !activeEdit" class="answer">
                    (None given)
                  </div>
                  <input
                    v-show="activeEdit"
                    v-model="volunteer.birthdate"
                    type="text"
                    class="form-control"/>
                </div>

              <div id="email" class="container-section">
                <div class="prompt">Email</div>
                <div v-show="!activeEdit" class="answer">{{volunteer.email}}</div>
                <div v-show="!volunteer.email && !activeEdit" class="answer">
                  (None given)
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.email"
                  type="text"
                  class="form-control" />
              </div>

              <div id="phone" class="container-section">
                <div class="prompt">Phone Number</div>
                <div v-show="!activeEdit" class="answer">{{ volunteer.phonePretty }}</div>
                <div v-show="!volunteer.phone && !activeEdit" class="answer">
                  (None given)
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.phonePretty"
                  type="text"
                  class="form-control" 
                  :class="{'invalid': invalidInputs.indexOf('phone') > -1}"/>
              </div>
              
              <div id="college" class="container-section">
                <div class="prompt">Your College</div>
                <div v-show="!activeEdit" class="answer">{{ volunteer.college }}</div>
                <div v-show="!volunteer.college && !activeEdit" class="answer">
                  (None given)
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.college"
                  type="text"
                  class="form-control"
                  :class="{'invalid': invalidInputs.indexOf('college') > -1}"
                />
              </div>

              <div id="highschool" class="container-section">
                <div class="prompt">Your Highschool</div>
                <div v-show="!activeEdit" class="answer">{{ volunteer.highschool }}</div>
                <div v-show="!volunteer.highschool && !activeEdit" class="answer">
                  (None given)
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.highschool"
                  type="text"
                  class="form-control"
                />
              </div>

              <div id="favoriteAcademicSubject" class="container-section">
                <div class="prompt">Your Favorite Academic Subject</div>
                <div v-show="!activeEdit" class="answer">
                  {{ volunteer.favoriteAcademicSubject }}
                </div>
                <div
                  v-show="!volunteer.favoriteAcademicSubject && !activeEdit"
                  class="answer"
                >
                  (None given)
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.favoriteAcademicSubject"
                  type="text"
                  class="form-control"
                  :class="{'invalid': invalidInputs.indexOf('favoriteAcademicSubject') > -1}"
                />
              </div>

              <div id="test-user" class="container-section">
                <div class="prompt">Test User</div>
                <div class="answer">{{volunteer.isTestUser ? 'Yes':'No' }} </div>
                <input
                    v-show="activeEdit"
                    v-model="volunteer.isTestUser"
                    type="checkbox"
                    class="form-control"
                  />
              </div>

              <div id="admin" class="container-section">
                <div class="prompt">Admin Access</div>
                <div class="answer">{{volunteer.isAdmin ? 'Yes':'No' }} </div>
                <input
                    v-show="activeEdit"
                    v-model="volunteer.isAdmin"
                    type="checkbox"
                    class="form-control"
                  />
              </div>
            
              <div id="volunteer-approved" class="container-section">
                <div class="prompt">Volunteer Approved</div>
                <div class="answer">{{volunteer.isVolunteerApproved ? 'Yes':'No' }} </div>
                <input
                    v-show="activeEdit"
                    v-model="volunteer.isVolunteerApproved"
                    type="checkbox"
                    class="form-control"
                  />
              </div>

              <div id="volunteer-approved-ready" class="container-section">
                <div class="prompt">Volunteer Ready</div>
                <div class="answer">{{volunteer.isVolunteerReady ? 'Yes':'No' }}</div>
              </div>
            </div>
        
            <div class = "info-subcontainer">
              <div id="certifications" class="container-section">
                <div class="prompt">Certifications</div>
                <div class="answer">
                  <div v-show="!activeEdit">
                    <div v-if="volunteer.hasCertification">
                      <div v-for="key in Object.keys(certifications)" :key="`certification-${key}`">
                        <div v-if="certifications[key]" class="certBox">
                          <div  :class="certKey[key]" class="certKey">
                            {{ certKey[key] }} 
                          </div>
                          <div class="certValue">{{ key }}</div>
                        </div>
                      </div>
                    </div>
                    <div v-else> (No certifications to show)</div>
                  </div>
                  <div v-if="activeEdit">
                    <div v-for="key in Object.keys(certifications)" :key = key>
                      <div v-if="certifications.hasOwnProperty(key)" class = "certBox">
                        <input 
                        v-show="activeEdit"
                        v-model="volunteer[key].passed"
                        type="checkbox"
                        class="form-control"
                        @change="certifications[key] = volunteer[key].passed">
                        <label  class="certValue"> {{key}} </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div id="availability" class="container-section--availability">
            <div class="prompt">Availability</div>
            <div class="answer">
              <div v-if="volunteer.hasSchedule">
                <div class = 'grid'>
                  <div v-for='(cell, index) in availabilityArray' :key = '`${index}`'>
                    <div v-if="isNaN(cell) || cell.length == 0">
                      <div class = 'cell-header'> {{cell}} </div>
                    </div>
                    <div v-else v-bind:class = "{'cell-true': cell, 'cell-false': !cell}">{{''}}</div>
                  </div>
                </div>
              </div>
              <div v-else> (No availability to show) </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserService from '@/services/UserService'
import phoneValidation from '@/utils/phone-validation'
import validator from 'validator'
import axios from 'axios'

export default {
  data () {
    return {
      msg: '',
      volunteer: {},
      activeEdit: false,
      editBtnMsg: 'Edit',
      errors: [],
      saveFailed: false,
      loading: false,
      certifications: {
        'algebra':false,
        'calculus':false,
        'essays':false,
        'precalculus': false,
        'geometry': false,
        'trigonometry': false,
        'esl':false,
        'planning': false,
        'applications': false},
      certKey: {},
      availabilityArray: [],
      invalidInputs: [],
      errors: []
    }
  },
  
  created () {
    var id = this.$route.params.id
    UserService.getVolunteer(this, id).then(volunteer =>{
      this.volunteer = volunteer
      this.setCertifications()
      this.getAvailability()
      })
    
  },

  methods: {
    getAvailability() {
      var daysOfWeek
      var timesOfDay
      const availability = this.volunteer.availability
      var availabilityArray = Array(8).fill(false).map(() => Array(25).fill(false))
      for (const day in availability) {
        for (const time in availability[day]) {
        // '$init' property and others are not skipped when nested
        if (time !== '$init' && availability[day].hasOwnProperty([time])) {
          if (!daysOfWeek) {
            daysOfWeek = Object.keys(availability)
          }
          if (!timesOfDay) {
            timesOfDay = Object.keys(availability[day])
          }
          let dayIndex = daysOfWeek.indexOf(day) + 1
          let timeIndex = timesOfDay.indexOf(time) + 1
          if (availability[day][time]) {
            availabilityArray[dayIndex][timeIndex] = true
          }
          daysOfWeek.forEach(function (value, index) {
            availabilityArray[index + 1][0] = daysOfWeek[index]
          })
          timesOfDay.forEach(function (value, index) {
            availabilityArray[0][index + 1] = timesOfDay[index]
          })
        }
      }
      }
      availabilityArray[0][0] = ''
      this.availabilityArray = availabilityArray.flat()
},

    setCertifications() {
      for(const key in this.certifications){
        if(this.volunteer.hasOwnProperty(key)){
          if(this.volunteer[key].passed){
            this.certifications[key] = true
          }
        }
      }
      this.certKey.algebra = 'MATH'
      this.certKey.geometry = 'MATH'
      this.certKey.trigonometry = 'MATH'
      this.certKey.precalculus = 'MATH'
      this.certKey.calculus = 'MATH'
      this.certKey.esl = 'ESL'
      this.certKey.planning = 'COLLEGE'
      this.certKey.essays = 'COLLEGE'
      this.certKey.applications = 'COLLEGE'

    },
        /**
     * Toggle editing state.
     * {Case A} if activeEdit === false: enter the editing state by setting activeEdit to true
     * {Case B} if activeEdit === true: save profile changes & exit the editing state by setting activeEdit to false
     */
    editProfile (user) {
      // {Case A} Enter the editing state, then early exit
      if (!this.activeEdit) {
        this.editBtnMsg = 'Save'
        this.activeEdit = true
        return
      }
      // {Case B} The remainder of this function saves new changes and exits the editing state

      // Start by erasing previous errors
      this.errors = []
      this.invalidInputs = []
      this.saveFailed = false

      if (!user.email) {
        this.errors.push('An email address is required.');
        this.invalidInputs.push('inputEmail');
      }

      else if (!validator.isEmail(user.email)) {
        // this is necessary because browsers ignore <input type="email"> until the
        // user actually tries to submit the form
        this.errors.push(user.email + ' is not a valid email address.');
        this.invalidInputs.push('inputEmail');
      }

      // validating phone number
      if (!user.phonePretty || !phoneValidation.validatePhoneNumber(user.phonePretty)) {
          this.errors.push('Please enter a valid U. S. phone number.')
          this.invalidInputs.push('phone')
        }

		    // a college name is required
        if (!user.college) {
          this.errors.push('A college is required.')
          this.invalidInputs.push('college')
		}
		    // a favorite academic subject is required
        if (!user.favoriteAcademicSubject) {
          this.errors.push('A favorite academic subject is required.')
          this.invalidInputs.push('favoriteAcademicSubject')
        }

        // a first name is required
        if (!user.firstname) {
          this.errors.push('A firstname is required.')
          this.invalidInputs.push('firstname')
        }
      
        // a first name is required
        if (!user.lastname) {
          this.errors.push('A lastname is required.')
          this.invalidInputs.push('lastname')
        }

        // a birthdate is required
        if (!UserService.validateBirthdate(user.birthdate)) {
          this.errors.push('A birthdate is required.')
          this.invalidInputs.push('birthdate')
        }
      if (!this.errors.length) {
        // form fields valid, so set profile
        // wait for save to succeed before coming out of edit mode
        UserService.editVolunteer(this, user)
        .then(res => {
          this.editBtnMsg = 'Edit'
          this.activeEdit = false
          this.saveFailed = false
          return
        }).catch(err => {
          this.msg = err.message
        })
      }
    },
  }
}
</script>

<style lang="scss" scoped>
body {
  font-family: "Work Sans", Helvetica, Arial, sans-serif;
  font-size: 14px;
}


.header {
  display: flex;
  padding: 30px;
  margin: 0;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
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

input[type="text"] {
  display: block;
  margin : 0 auto;
  margin-bottom: 5px;
}

input[type="checkbox"] {
  margin-right : 30px;
  margin-bottom: 5px;
  vertical-align:middle;
}



button {
  height: 30px;
  border-radius: 20px;
  padding: 0px 10px;
  color: #16d2aa;
  background-color: #f17777;
}

.editBtn {
  font-size: 20px;
  font-weight: 600;
  color: #343440;
  background-color: #fff;
}

.editBtn:active,
.editBtn:hover {
  background-color: #fff;
  color: #16d2aa;
  box-shadow: none;
  margin: 0px;
}

.editBtn a {
  color: white;
}

.editBtn a:hover {
  color: #2c3e50;
  text-decoration: none;
}
.wrap-container {
  display: flex;
  flex-wrap: wrap;
}

.contain {
  display: flex;
  flex-direction: column;
  margin: auto;
  margin-bottom: 10px;
  margin-top: 10px;
  justify-content: center;
}

.container-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
 &--availability {
    @extend .container-section;
    align-items: center;
  }
}

.basic-info-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 40px
  
}

.container-content {
  background-color: #f0f8fd;
  padding: 30px;
  text-align: left;
  height: 100%;
  display: flex;
  flex-direction: column;
 
}

.subheader {
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  background-color: #e3f2fd;
  font-size: 20px;
}

.answer {
  font-weight: 600;
}

.answer ul {
  margin-left: 20px;
}

.volunteer-profile {
  font-size: 16px;
  font-family: $default-font;
}

.certBox {
  display: flex;
  height: 60px;
  align-items: center;
  justify-content: left;
  border-bottom: 1px solid #cccccf;
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

.grid{
    display: grid;
    margin: 20px;
    grid-auto-flow: column;
    grid-template-columns: 30px repeat(7, 1fr);
    grid-template-rows: repeat(25, 1fr);
    grid-gap: 2px;
}

.cell {
height: 20px;
  &-true {
    @extend .cell;
     border: 1px solid grey;
    background-color:  #16d2aa;
  }
  &-false  {
     border: 1px solid grey;
      @extend .cell;
    background-color: white;
  }
  &-header {
    @extend .cell;
    text-align: center;
    background-color: transparent;

  }
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
ul {
  padding: 15px;
  height: 100%;
  margin: auto;
}

.certValue {
  flex-grow: 1;
}

.HELP{
  display: flex;
 
}

// .checkbox input,.checkbox label{
// 	display:inline-block;
// 	vertical-align:middle;	
// }
</style>