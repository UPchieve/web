<template>
  <div class="volunteer-profile">
    <div class="header"> {{volunteer.firstname}}'s Profile
      <div class = "header-right">
        <div class = "VBtn btn">
          <router-link to="/admin/volunteers" 
          class="prompt"> 
          Back</router-link>
        </div>
        <button class="VBtn btn"
          @click="editProfile(volunteer)">
          {{ editBtnMsg }}
        </button>
      </div>
    </div>
    <div class = "wrap-container">
      <div class = "contain--errors">
        <div v-if="errors.length" class="errors">
          <h4 class="errors-heading">Please correct the following problem<span v-if="errors.length > 1">s</span> before saving:</h4>
          <ul class="errors-list">
            <li v-for="error in errors" :key="error" >{{ error }}</li>
          </ul>
        </div>
        <div v-if="saveFailed" class="errors">
          <h4 class="errors-heading">Could not save data</h4>
        </div>
      </div>
      <div class="contain--info">
        <div class="subheader">{{volunteer.firstname}} {{volunteer.nickname 
          ? "\"" + volunteer.nickname + "\"": ''}} {{volunteer.lastname}} 
        </div>
        <div class = "info-subcontainer">
          <div class = "info-subcontainer-content">

            <div id="firstname" class="info">
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

            <div id="lastname" class="info">
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

            <div id="nickname" class="info">
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

            <div id="ID" class="info">
              <div class="prompt">ID</div>
              <div class="answer">{{ volunteer._id }}</div>
              <div v-show="!volunteer._id" class="answer">
                (None given)
              </div>
            </div>
          
            <div id="gender" class="info">
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

            <div id="birthdate" class="info">
              <div class="prompt">Birthdate</div>
              <div v-show="!activeEdit" class="answer">{{ volunteer.birthdate}}</div>
              <div v-show="!volunteer.birthdate && !activeEdit" class="answer">
                (None given)
              </div>
              <input
                v-show="activeEdit"
                v-model="volunteer.birthdate"
                type="text"
                class="form-control"
                :class="{'invalid': invalidInputs.indexOf('birthdate') > -1}" />
            </div>

            <div id="email" class="info">
              <div class="prompt">Email</div>
              <div v-show="!activeEdit" class="answer">{{volunteer.email}}</div>
              <div v-show="!volunteer.email && !activeEdit" class="answer">
                (None given)
              </div>
              <input
                v-show="activeEdit"
                v-model="volunteer.email"
                type="text"
                class="form-control"
                :class="{'invalid': invalidInputs.indexOf('email') > -1}" />
            </div>

            <div id="phone" class="info">
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
            
            <div id="college" class="info">
              <div class="prompt">College</div>
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

            <div id="highschool" class="info">
              <div class="prompt">Highschool</div>
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

            <div id="favoriteAcademicSubject" class="info">
              <div class="prompt">Favorite Academic Subject</div>
              <div v-show="!activeEdit" class="answer">{{ volunteer.favoriteAcademicSubject }}
              </div>
              <div
                v-show="!volunteer.favoriteAcademicSubject && !activeEdit"
                class="answer">
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

            <div id="test-user" class="info">
              <div class="prompt">Test User</div>
              <div class="answer">{{volunteer.isTestUser ? 'Yes':'No' }} </div>
              <input
                  v-show="activeEdit"
                  v-model="volunteer.isTestUser"
                  type="checkbox"
                  class="form-control"
                />
            </div>

            <div id="admin" class="info">
              <div class="prompt">Admin Access</div>
              <div class="answer">{{volunteer.isAdmin ? 'Yes':'No' }} </div>
              <input
                  v-show="activeEdit"
                  v-model="volunteer.isAdmin"
                  type="checkbox"
                  class="form-control"
                />
            </div>
          
            <div id="volunteer-approved" class="info">
              <div class="prompt">Volunteer Approved</div>
              <div class="answer">{{volunteer.isVolunteerApproved ? 'Yes':'No' }} </div>
              <input
                  v-show="activeEdit"
                  v-model="volunteer.isVolunteerApproved"
                  type="checkbox"
                  class="form-control"
                />
            </div>

            <div id="volunteer-approved-ready" class="info">
              <div class="prompt">Volunteer Ready</div>
              <div class="answer">{{volunteer.isVolunteerReady ? 'Yes':'No' }}</div>
            </div>
          </div>
        
          <div class = "info-subcontainer-content">
            <div id="certifications" class="info">
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
                      <label class="certValue">
                      <input 
                      v-model="volunteer[key].passed"
                      type="checkbox"
                      @change="certifications[key] = volunteer[key].passed, 
                      volunteer.hasCertification = checkHasCertification()">
                        {{key}} </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

     <div id="availability" class="contain--availability">
        <div class="prompt">Availability</div>
        <div class="answer">
          <div v-if="this.displayAvailability">
            <div class="table-layout">
              <div class="subtable--days">
                <div
                  class="cell--header--days"
                  v-for="day in availability.daysOfWeek"
                  :key="`${day}`">
                  {{ day }}
                </div>
              </div>
              <div class="subtable--times">
                <div
                  class="cell--header--times"
                  v-for="time in availability.timesOfDay"
                  :key="`${time}`">
                  {{ time }}
                </div>
              </div>
              <div class="subtable--data">
                <div
                  v-for="(cell, index) in availability.table"
                  :key="`${index}`">
                  <div :class = "{'cell--true': cell, 'cell--false': !cell}">{{''}}</div>
                </div>
              </div>
            </div>
          </div>
          <div v-else> (No availability to show) </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import UserService from '@/services/UserService'
import phoneValidation from '@/utils/phone-validation'
import AuthService from '@/services/AuthService'
import validator from 'validator'
import _ from "lodash";

export default {
  data () {
    return {
      volunteer: {}, //stores this volunteer
      activeEdit: false,
      editBtnMsg: 'Edit',
      errors: [],
      saveFailed: false,
      certifications: {
        'algebra':false,
        'applications': false,
        'biology': false,
        'calculus':false,
        'chemistry': false,
        'esl':false,
        'essays':false,
        'geometry': false,
        'precalculus': false,
        'trigonometry': false,
        'planning': false,
        },
      certKey: {}, //stores a map to larger category of each subtopic, used for label
      availability: {}, //stores availability array in a simpler for to display
      invalidInputs: [], //tracks which inputs were invalids
      displayAvailability: false //checks whether availability is empty, or filled with non-booleans
    }
  },
  
  created () {
    var id = this.$route.params.id
    UserService.getVolunteer(this, id).then(volunteer =>{
      this.volunteer = volunteer
      this.setCertifications()
      this.getAvailability()
      this.displayAvailability = this.checkIfAvailability()
      })
    
  },

  methods: {
    checkIfAvailability () {
      return _.isBoolean(_.get(this.volunteer.availability, 'Sunday.4p', null))
    },
    // updates the virtual hasCertification property
    checkHasCertification () {
      return Object.values(this.certifications).includes(true)
    },

    /* converts availability into 2D flat array with row and column headers to 
    make it cleaner to display in grid form*/
    getAvailability () {
      const tempAvailability = this.volunteer.availability
      //create 2d array of availability with headers for columns and rows 
      this.availability.table = Array(7).fill(false).map(() => Array(24).fill(false))
      for (const day in tempAvailability) {
        for (const time in tempAvailability[day]) {
          // '$init' property and others are not skipped when nested
          if (time !== '$init' && tempAvailability[day].hasOwnProperty([time])) {
            // saving headers automatically as property of this.availability
            if (!this.availability.hasOwnProperty('daysOfWeek')) {
              this.availability.daysOfWeek = Object.keys(tempAvailability)
            }
            if (!this.availability.hasOwnProperty('timesOfDay')) {
              this.availability.timesOfDay = Object.keys(tempAvailability[day])
            }
            let dayIndex = this.availability.daysOfWeek.indexOf(day)
            let timeIndex = this.availability.timesOfDay.indexOf(time)
            if (tempAvailability[day][time]) {
              this.availability.table[dayIndex][timeIndex] = true
            }
          }
        }
      }  
      this.availability.table = this.availability.table.flat()
    },

    // stores certifications that volunteer has in certification objects 
    setCertifications () {
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
      this.certKey.biology = 'SCIENCE'
      this.certKey.chemistry = 'SCIENCE'

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
      var checkEmailPromise = null

      // checks if email is a valid email
      if (!validator.isEmail(user.email)) {
          // this is necessary because browsers ignore <input type="email"> until the
          // user actually tries to submit the form
          this.errors.push('\"'+ user.email + '\" is not a valid email address.')
          this.invalidInputs.push('email')
          }
      else { //if email is not valid check if email is taken by another user
          checkEmailPromise = AuthService.checkEmail(this, {
          email: user.email,
          userid: user._id
        })
        .catch(err => {
          this.errors.push(err.message)
          this.invalidInputs.push('email')
        })  
      }
        
      // validating phone number
      if (!user.phonePretty || !phoneValidation.validatePhoneNumber(user.phonePretty)) {
          this.errors.push('A valid U. S. phone number is required.')
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
        if (!user.birthdate || !UserService.validateBirthdate(user.birthdate)) {
          this.errors.push('A valid birthdate is required.')
          this.invalidInputs.push('birthdate')
        }
      
      //after checking email is not taken, display errors
      checkEmailPromise.then(function processErrors() {
        if (!this.errors.length) {
          // form fields valid, so set profile
          // wait for save to succeed before coming out of edit mode
          UserService.editVolunteer (this, user)
          .then (res => {
            this.editBtnMsg = 'Edit'
            this.activeEdit = false
            this.saveFailed = false
            return
          }).catch (err => {
            this.saveFailed = true
            this.msg = err.message
          })
        }
      })
    },
  }
}
</script>

<style lang="scss" scoped>


.volunteer-profile {
  font-size: 16px;
  font-family: $default-font;
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

.VBtn {
  font-size: 20px;
  font-weight: 600;
  color: #343440;
  background-color: #fff;
}

.VBtn:active,
.VBtn:hover {
  background-color: #fff;
  color: #16d2aa;
  box-shadow: none;
  margin: 0px;
}

.VBtn a {
  color: #343440;
}

.VBtn a:hover {
  color: #16d2aa;
  text-decoration: none;
}

.wrap-container {
  display: flex;
  width: auto;
  margin: 40px;
  flex-direction: column;
}

.contain {
  display: flex;
  flex-direction: column;
  justify-content: center;
  &--info, 
  &--availability{
    background-color: #f0f8fd;
    padding-bottom: 20px;
  }
}

.info-subcontainer {
    padding: 30px;
    display: flex;
    flex-flow: row;
    flex-wrap: wrap-reverse;
    padding: 40px;
    justify-content: space-around;

}

.info-subcontainer-content {
    padding: 20px;
    text-align: left;
    flex-direction: column;
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

.subheader {
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  background-color: #e3f2fd;
  font-size: 20px;
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

.info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
}

.answer {
  font-weight: 600;
}

.answer ul {
  margin-left: 20px;
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

.SCIENCE {
  background-color: lightgreen;
}


.cell {
height: 20px;
  &--true {
    @extend .cell;
    border: 1px solid grey;
    background-color:  #16d2aa;
  }
  &--false  {
    @extend .cell;
    border: 1px solid grey;
    background-color: white;
  }
  &--header {
    @extend .cell;
    font-size: 50%;
    text-align: center;
    background-color: transparent;
  }
}
.table-layout {
  display: grid;
  grid-template-areas: 
    ". days"
    "times data";
  grid-template-columns: auto 1fr;
  padding: 5px;

}

.subtable {
  display: grid;
  grid-gap: 2px;
  &--days {
    @extend .subtable;
    grid-area: days;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    grid-template-rows: 1fr;
    margin-top: 20px;
    margin-bottom: 5px;
  }
  &--times {
    @extend .subtable;
    grid-area: times;
    grid-template-columns: min-content;
    grid-template-rows: repeat(24, 1fr);
    margin-right: 10px;
    grid-auto-flow: column;
  }
  &--data {
    @extend .subtable;
    grid-area: data;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    grid-template-rows: repeat(24, 1fr);
    grid-auto-flow: column;
  }
}

@media only screen and (max-width: 1000px) {
  .header {
    padding: 1em 20px 1em 3em !important;
  }
  .cell--header--days {
    visibility: hidden;
    width: 30px;

    &::first-letter {
      text-align: center;
      visibility:visible;
      }
  } 
  
}

</style>