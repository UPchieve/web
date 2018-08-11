<template>
  <div class="profile-editor">
    <div class="header">
        <h2>Registration: First Time Use Survey</h2>
    </div>
    <div class="registration-body">
      <div class="description">Before you can request a tutor, we request that you
       fill out this short survey so that we can continue to improve our services.
       You will not be asked to take this again.</div>

      <div class="alert alert-danger" role="alert" v-if="error">{{error}}</div>

      <ul class="row form-group" v-if="!user.isVolunteer">
        <p>Do you identify with any of the following minority groups? (Please select all that apply.)</p>
        <div class=option-container>
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
      </ul>

      <ul class="row form-group" v-if="!user.isVolunteer">
        <p>Do you have access to a computer or phone with internet access? (Please select all that apply.)</p>
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

      <div class="row form-group">
       <p>Where/How are you currently accessing the internet?</p>
         <div class="row">
            <div class="col-sm-6">
             <select class="form-control" v-model="user.computerAccessLocation">
               <option></option>
               <option>School’s computer lab/library</option>
               <option>Public library</option>
               <option>Community center</option>
               <option>Shelter</option>
               <option>Using a friend’s computer or smartphone</option>
               <option>Other</option>
              </select>
            </div>
          </div>
      </div>

      <div class="row form-group">
       <p>At what time do you usually do your homework?</p>
         <div class="row">
            <div class="col-sm-6">
             <select class="form-control" v-model="user.homeworkTime">
               <option></option>
               <option>In the morning before school</option>
               <option>During school</option>
               <option>After school (2-5pm)</option>
               <option>Early evening (5-9pm)</option>
               <option>Late evening (after 9pm)</option>
              </select>
            </div>
          </div>
      </div>

      <div class="row form-group">
        <p>Which academic subject do you find most difficult?</p>
       <div class="row">
         <div class="col-sm-12">
           <input type="text" v-model="user.difficultAcademicSubject" class="form-control">
         </div>
       </div>
    </div>

    <div class="row form-group">
      <p>What is your current GPA? Please fill out on a 4.0 scale if possible.</p>
     <div class="row">
       <div class="col-sm-12">
         <input type="text" v-model="user.gpa" class="form-control">
       </div>
     </div>
  </div>

    <div class="row form-group">
       <p>Which part of the college application process do you find most difficult?</p>
        <div class="row">
         <div class="col-sm-6">
         <div class="checkbox">
                <label>
                <input type="checkbox" value="PersonalStatement" v-model="user.difficultCollegeProcess">
               Personal Statement / Essay
               </label>
              </div>
              <div class="checkbox">
              <label>
              <input type="checkbox" value="Resume" v-model="user.difficultCollegeProcess">
                           Resume
                           </label>
                             </div>
         </div>

         <div class="col-sm-6">
         <div class="checkbox">
                <label>
                 <input type="checkbox" value="Exams" v-model="user.difficultCollegeProcess">
               SAT / ACT Exams
               </label>
                          </div>
                          <div class="checkbox">
                            <label>
                            <input type="checkbox" value="ChoosingSchools" v-model="user.difficultCollegeProcess">
               Choosing which schools to apply to
               </label>
               </div>
              <div class="checkbox">
                 <label>
                 <input type="checkbox" value="Other" v-model="user.difficultCollegeProcess">
                  Other
                  </label>
              </div>
          </div>
        </div>
      </div>

     <div class="row form-group">
       <p>What is the highest level of education completed by one of your parents?</p>
       <div class="row">
          <div class="col-sm-12">
               <div class="checkbox">
                 <label>
               <input type="checkbox" value="SomeHighSchool" v-model="user.highestLevelEducation">
               Some high school
               </label>
              </div>
              <div class="checkbox">
                <label>
                <input type="checkbox" value="HighSchoolGED" v-model="user.highestLevelEducation">
                High school/GED degree
                </label>
                     </div>
                     <div class="checkbox">
                       <label>
                 <input type="checkbox" value="SomeCollege" v-model="user.highestLevelEducation">
                    Some college
                    </label>
                     </div>
                     <div class="checkbox">
                       <label>
                     <input type="checkbox" value="AssociatesDegree" v-model="user.highestLevelEducation">
               Associate's degree
               </label>
                       </div>
                       <div class="checkbox">
                         <label>
                     <input type="checkbox" value="BachelorsDegree" v-model="user.highestLevelEducation">
                      Bachelor's degree
                      </label>
                     </div>
                     <div class="checkbox">
                          <label>
                     <input type="checkbox" value="MastersDegreeHigher" v-model="user.highestLevelEducation">
                     Master’s degree or higher
                     </label>
                       </div>
                       <div class="checkbox">
                         <label>
                      <input type="checkbox" value="NotSure" v-model="user.highestLevelEducation">
                   Not sure
                   </label>
                               </div>
                             </div>
                           </div>
                     </div>

                <div class="row form-group">
                 <p>Does your high school have a college guidance counselor?</p>
                   <div class="row">
                      <div class="col-sm-6">
                     <select class="form-control" v-model="user.hasGuidanceCounselor">
                       <option></option>
                         <option>Yes</option>
                       <option>No</option>
                       <option>I don't know</option>
                      </select>
                   </div>
                  </div>
                </div>

                <div class="row form-group">
                 <p>How did you hear about UPchieve?</p>
                   <div class="row">
                      <div class="col-sm-6">
                     <select class="form-control" v-model="user.heardFrom">
                       <option></option>
                       <option>Flyer</option>
                       <option>Email</option>
                       <option>Friend</option>
                       <option>Family</option>
                       <option>Teacher</option>
                       <option>Mentor</option>
                       <option>Other</option>
                      </select>
                   </div>
                  </div>
                </div>

      <div class="btn-container">
        <button class="btn btn-lg btn-primary btn-block back" type="back" @click.prevent="back">BACK</button>
        <button class="btn btn-lg btn-primary btn-block next" type="submit" @click.prevent="submitProfile">{{buttonMsg}}</button>
      </div>
    </div>
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
      buttonMsg: 'DONE',
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
        } else if (!this.user.computerAccessLocation || this.user.computerAccessLocation === ''){
          this.error = 'Please provide where you are accessing this site from' ;
        } else if (!this.user.homeworkTime || this.user.homeworkTime === ''){
          this.error = 'Please provide the times times you generally do your homework' ;
        } else if (!this.user.difficultAcademicSubject || this.user.difficultAcademicSubject === ''){
          this.error = 'Please provide the academic subjects you find most difficult' ;
        } else if (!this.user.gpa || this.user.gpa === ''){
          this.error = 'Please provide your GPA' ;
        } else if (!this.user.difficultCollegeProcess.length){
          this.error = 'Please provide the aspects of the college process that are most difficult' ;
        } else if (!this.user.highestLevelEducation.length){
          this.error = 'Please provide your parent\'s highest level of education' ;
        } else if (!this.user.hasGuidanceCounselor || this.user.hasGuidanceCounselor === ''){
          this.error = 'Please provide whether or not you have a guidance counselor' ;
        } else if (!this.user.heardFrom || this.user.heardFrom === ''){
          this.error = 'Please provide where you heard about UPchieve' ;
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
  background-color: #FFFFFF;
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

.description {
  font-size: 16px;
  max-width: 650px;
  text-align: left;
  padding: 0px 50px 30px;
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

button[type="submit"], button[type="back"] {
  width: 140px;
  height: 40px;
  background-color: #F6F6F6;
  color: #16D2AA;
  border: none;
  font-weight: 600;
  margin: 0 50px 50px 50px;
  border-radius: 20px;
  font-size: 12px;
  float: right;
}

button[type="submit"]:hover, button[type="submit"]:active,
button[type="back"]:hover, button[type="back"]:active {
  background-color: #16D2AA;
  color: #FFF;
}

.btn-container {
  max-width: 650px;
  display: flex;
  justify-content: space-between;
}

.profile-editor {
  display: flex;
  flex-direction: column;
  background-color: #E3F2FD;
}

.registration-body {
  padding-top: 50px;
  width: 620px;
  align-self: center;
  background-color: #FFFFFF;
  border-left: 5px solid #1855D1;
}

</style>
