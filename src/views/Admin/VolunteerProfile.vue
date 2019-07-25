<template>
  <div class="volunteer-profile">
    <div class="header">
      {{volunteer.firstname}}'s Profile
      <button
      class="editBtn btn"
      @click="editApproval(volunteer)">
      {{ editBtnMsg }}
      </button>
    </div>
    <div class = "wrap-container">
      <div class="contain">
        <div class="subheader">{{volunteer.firstname}} {{volunteer.nickname ? "\"" + volunteer.nickname + "\"": ''}} {{volunteer.lastname}} </div>
        <div class="container-content" >
          <div class="basic-info-container">
          <div class = "info-subcontainer--basic">
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
                class="form-control" />
                <!-- :class="{'invalid': invalidInputs.indexOf('phone') > -1}" -->
            </div>
              

            <div id="college" class="container-section">
              <div class="prompt">College</div>
              <div class="answer">{{volunteer.college}}</div>
            </div>

            <div id="fav-subject" class="container-section">
              <div class="prompt">Favorite Academic Subject</div>
              <div class="answer">{{volunteer.favoriteAcademicSubject}}</div>
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
              <input
                  v-show="activeEdit"
                  v-model="volunteer.isVolunteerReady"
                  type="checkbox"
                  class="form-control"
                />
            </div>
          </div>
        

          <div class = "info-subcontainer--certifications">
            <div id="certifications" class="container-section">
              <div class="prompt">Certifications</div>
              <div class="answer">
                <div v-for="(value, key) in certifications" :key="`certification-${key}-${value}`">
                  <div v-if="value" class="certBox">
                    <div :class="certKey[key]" class="certKey">
                      {{ certKey[key] }} </div>
                    <div class="certValue">{{ key }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
            <div id="availability" class="container-section--availability">
              <div class="prompt">Availability</div>
              <div class="answer">
                <div class = 'grid'>
                  <div v-for='(cell, index) in volunteer.availabilityArray' :key = '`${index}`'>
                    <div v-if="isNaN(cell) || cell.length == 0">
                      <div class = 'cell-header'> {{cell}} </div>
                    </div>
                    <div v-else v-bind:class = "{'cell-true': cell, 'cell-false': !cell}">{{''}}</div>
                  </div>
                </div>
              </div>
            </div>
                    </div>
                            </div>

 
      </div>
    </div>
  </div>
    </div>


        <!-- <div class="contain">
        <div class="subheader">Availability</div>
          <div class="container-content">
             <div class = 'grid'>
               <div v-for='(cell, index) in volunteer.availabilityArray'
                        :key = '`${index}`'>
                                <div v-if="isNaN(cell) || cell.length == 0">
                                  <div class = 'cell-header'>
                                {{cell}} </div>
                                </div>
                                <div v-else v-bind:class = "{'cell-true': cell, 'cell-false': !cell}">
                                {{''}}</div>
                            </div>
               </div>
            </div>
        </div> -->

</template>

<script>
import UserService from '@/services/UserService'
import phoneValidation from '@/utils/phone-validation'

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
      certifications: {},
      certKey: {},
      
    }
  },
  
  created () {
    var id = this.$route.params.id
    UserService.getVolunteer(this, id).then(volunteer =>{
      this.volunteer = volunteer
      this.volunteer.phonePretty = phoneValidation.convertPhoneNumber(this.volunteer.phone)
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
            console.log(daysOfWeek)
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
      this.volunteer.availabilityArray = availabilityArray.flat()
},

    setCertifications(){
    if (this.volunteer.algebra) {
      if (this.volunteer.algebra.passed) {
        this.certifications.Algebra = true
      }
    }
    if (this.volunteer.geometry) {
      if (this.volunteer.geometry.passed) {
        this.certifications.Geometry = true
      }
    }
    if (this.volunteer.trigonometry) {
      if (this.volunteer.trigonometry.passed) {
        this.certifications.Trigonometry = true
      }
    }
    if (this.volunteer.precalculus) {
      if (this.volunteer.precalculus.passed) {
        this.certifications.Precalculus = true
      }
    }
    if (this.volunteer.calculus) {
      if (this.volunteer.calculus.passed) {
        this.certifications.Calculus = true
      }
    }
    if (this.volunteer.esl) {
      if (this.volunteer.esl.passed) {
        this.certifications.ESL = true
      }
    }
    if (this.volunteer.planning) {
      if (this.volunteer.planning.passed) {
        this.certifications.Planning = true
      }
    }
    if (this.volunteer.essays) {
      if (this.volunteer.essays.passed) {
        this.certifications.Essays = true
      }
    }
    if (this.volunteer.applications) {
      if (this.volunteer.applications.passed) {
        this.certifications.Applications = true
      }
    }

    this.certKey.Algebra = 'MATH'
    this.certKey.Geometry = 'MATH'
    this.certKey.Trigonometry = 'MATH'
    this.certKey.Precalculus = 'MATH'
    this.certKey.Calculus = 'MATH'
    this.certKey.ESL = 'ESL'
    this.certKey.Planning = 'COLLEGE'
    this.certKey.Essays = 'COLLEGE'
    this.certKey.Applications = 'COLLEGE'

    },
        /**
     * Toggle editing state.
     * {Case A} if activeEdit === false: enter the editing state by setting activeEdit to true
     * {Case B} if activeEdit === true: save profile changes & exit the editing state by setting activeEdit to false
     */
    editApproval (user) {
      // {Case A} Enter the editing state, then early exit
      if (!this.activeEdit) {
        this.editBtnMsg = 'Save'
        this.activeEdit = true
        return
      }
      // {Case B} The remainder of this function saves new changes and exits the editing state

      // Start by erasing previous errors
      this.saveFailed = false

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

.info-subcontainer {
  &--basic{
    align-content: left;
    justify-content: left;
  }
  &--certifications{
    align-content: right;
    justify-content: right;
  }
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
  padding-left: 20px;
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
</style>