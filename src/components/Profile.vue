<template>
<div class="profile">
  <div class="header">
    Profile
    <button @click="saveProfile()" class="saveBtn btn">{{ saveBtnMsg }}</button>
  </div>
  <div class="basic-info">
    <div class="section" id="profilePic">
      <div class="prompt">Your profile picture</div>
      <div class="answer avatar" v-bind:style="avatarStyle">
      </div>
    </div>
    <div class="name">
      <div class="section" id="firstname">
        <div class="prompt">Your first name</div>
        <div v-show="'firstname' !== activeEdit" class="answer">{{ user.firstname }}</div>
        <input type="text" v-model="user.firstname" v-show="'firstname' === activeEdit">
        <button @click="editField('firstname')">{{ fieldButtons.firstname }}</button>
      </div>
      <div class="section" id="lastname">
        <div class="prompt">Your last name</div>
        <div v-show="'lastname' !== activeEdit" class="answer">{{ user.lastname }}</div>
        <input type="text" v-model="user.lastname" v-show="'lastname' === activeEdit">
        <button @click="editField('lastname')">{{ fieldButtons.lastname }}</button>
      </div>
    </div>

    <div class="section" id="email">
      <div class="prompt">Your email</div>
      <div class="answer">{{ user.email }}</div>
    </div>

    <div class="section"><router-link to="resetpassword" class="prompt">Reset password</router-link></div>
  </div>

  <div v-if="!user.isVolunteer">
    <div class="section" id="highschool">
      <div class="prompt">Your high school</div>
      <div class="answer" v-show="'highschool' !== activeEdit">{{ user.highschool }}</div>
      <input type="text" v-model="user.highschool" v-show="'highschool' === activeEdit">
      <button @click="editField('highschool')" class="sectionBtn">{{ fieldButtons.highschool }}</button>
    </div>

    <div class="section" id="currentGrade">
      <div class="prompt">Your current grade</div>
      <div class="answer" v-show="'currentGrade' !== activeEdit">{{ user.currentGrade }}</div>
      <select class="form-control" v-model="user.currentGrade" v-show="'currentGrade' === activeEdit">
        <option></option>
        <option>Freshman</option>
        <option>Sophomore</option>
        <option>Junior</option>
        <option>Senior</option>
      </select>
      <button @click="editField('currentGrade')" class="sectionBtn">{{ fieldButtons.currentGrade }}</button>
    </div>

    <div class="section" id="expectedGraduation">
      <div class="prompt">Your expected graduation year</div>
      <div class="answer" v-show="'expectedGraduation' !== activeEdit">{{ user.expectedGraduation }}</div>
      <select class="form-control" v-model="user.expectedGraduation" v-show="'expectedGraduation' === activeEdit">
        <option></option>
        <option>2017</option>
        <option>2018</option>
        <option>2019</option>
        <option>2020</option>
        <option>2021</option>
        <option>2022</option>
      </select>
      <button @click="editField('expectedGraduation')" class="sectionBtn">{{ fieldButtons.expectedGraduation }}</button>
    </div>

    <div class="section" id="difficultAcademicSubject">
      <div class="prompt">Your most difficult academic subject</div>
      <input type="text" v-model="user.difficultAcademicSubject" v-show="'difficultAcademicSubject' === activeEdit">
      <div class="answer" v-show="'difficultAcademicSubject' !== activeEdit">{{ user.difficultAcademicSubject }}</div>
      <button @click="editField('difficultAcademicSubject')" class="sectionBtn">{{ fieldButtons.difficultAcademicSubject }}</button>
    </div>

    <div class="section" id="difficultCollegeProcess">
      <div class="prompt">Aspects of the college process you have found difficult</div>
      <div class="difficultCollegeProcessAnswer" v-show="'difficultCollegeProcess' === activeEdit">
        <label>
          <input type="checkbox" value="PersonalStatement" v-model="user.difficultCollegeProcess">
          Personal Statement / Essay
        </label>
        <label>
          <input type="checkbox" value="Resume" v-model="user.difficultCollegeProcess">
          Resume
        </label>
        <label>
          <input type="checkbox" value="Application" v-model="user.difficultCollegeProcess">
          Filling out application
        </label>
        <label>
          <input type="checkbox" value="Exams" v-model="user.difficultCollegeProcess">
          SAT / ACT Exams
        </label>
        <label>
          <input type="checkbox" value="ChoosingSchools" v-model="user.difficultCollegeProcess">
          Choosing which schools to apply to
        </label>
      </div>
      <div class="answer">
        <ul v-show="'difficultCollegeProcess' !== activeEdit" v-for="item in user.difficultCollegeProcess">
          <li>{{ item }}</li>
        </ul>
      </div>
      <div class="answer"><button @click="editField('difficultCollegeProcess')" class="sectionBtn">{{ fieldButtons.difficultCollegeProcess }}</button></div>
    </div>

    <div class="section" id="hasGuidanceCounselor">
      <div class="prompt">Do you have a guidance counselor</div>
      <select class="form-control" v-model="user.hasGuidanceCounselor" v-show="'hasGuidanceCounselor' === activeEdit">
        <option></option>
        <option>Yes</option>
        <option>No</option>
        <option>I don't know</option>
      </select>
      <div class="answer" v-show="'hasGuidanceCounselor' !== activeEdit">{{ user.hasGuidanceCounselor }}</div>
      <button @click="editField('hasGuidanceCounselor')" class="sectionBtn">{{ fieldButtons.hasGuidanceCounselor }}</button>
    </div>

    <div class="section" id="gpa">
      <div class="prompt">Your GPA</div>
      <div class="answer" v-show="'gpa' !== activeEdit">{{ user.gpa }}</div>
      <input type="text" v-model="user.gpa" v-show="'gpa' === activeEdit">
      <button @click="editField('gpa')" class="sectionBtn">{{ fieldButtons.gpa }}</button>
    </div>

    <div class="section" id="collegeApplicationsText">
      <div class="prompt">The colleges and universities you are considering apply to</div>
      <div class="answer" v-show="'collegeApplicationsText' !== activeEdit">{{ user.collegeApplicationsText }}</div>
      <input type="text" v-model="user.collegeApplicationsText" v-show="'collegeApplicationsText' === activeEdit">
      <button @click="editField('collegeApplicationsText')" class="sectionBtn">{{ fieldButtons.collegeApplicationsText }}</button>
    </div>
  </div>

</div>

</template>

<script>
import UserService from 'src/services/UserService'

export default {
  data() {
    var user = UserService.getUser();
    var avatarUrl = user.picture || 'static/defaultavatar.png';
    var fieldnames = ['firstname', 'lastname', 'highschool', 'currentGrade',
    'expectedGraduation', 'difficultAcademicSubject', 'difficultCollegeProcess',
    'hasGuidanceCounselor', 'gpa', 'collegeApplicationsText'];
    var fieldButtons = [];
    fieldnames.map(function(field) {
      fieldButtons[field] = 'Edit';
    });
    return {
      user: user,
      activeEdit: null,
      fieldButtons: fieldButtons,
      saveBtnMsg: 'Save Profile',
      name: user.firstname || (user.isVolunteer ? 'volunteer' : 'student'),
      avatarStyle: {
        backgroundImage: `url(${avatarUrl})`
      }
    }
  },
  methods: {
    editField: function(field) {
      if (field !== this.activeEdit) {
        this.activeEdit = field;
        this.fieldButtons[field] = 'Done';
        this.savBtnMsg = 'Save Profile';
      } else {
        this.activeEdit = null;
        this.fieldButtons[field] = 'Edit';
      }
    },
    saveProfile() {
      UserService.setProfile(this, this.user);
      this.saveBtnMsg = 'Profile is saved!';
    }
  }
}
</script>

<style scoped>

.avatar {
  display: block;
  width: 50px;
  height: 50px;
  background-size: cover;
}

button {
  height: 30px;
  border-radius: 20px;
  padding: 0px 10px;
  color: #16D2AA;
  background-color: #F6F6F6;
}

button:active, button:hover {
  background-color: #16D2AA;
  color: #FFF;
}

.saveBtn {
  font-size: 16px;
  font-weight: 600;
  color: #343440;
  background-color: #FFF;
}

.saveBtn:active, .saveBtn:hover {
  background-color: #FFF;
  color: #16D2AA;
  box-shadow: none;
  margin: 0px;
}

select, input[type=text] {
  width: 200px;
  margin-right: 10px;
  border-color: #16D2AA;
  border-style: solid;
}

.profile {
  font-size: 16px;
  font-family: Work Sans;
}

.header {
  display: flex;
  padding: 30px;
  margin: 0px 0px 20px 0px;
  font-size: 24px;
  border-bottom: 0.5px solid #CCCCCF;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}

.basic-info {
  border-bottom: 0.5px solid #CCCCCF;
  padding-bottom: 20px;
  margin-bottom: 20px;
}

.section {
  display: flex;
  align-items: center;
  height: 60px;
}

.prompt {
  width: 300px;
  text-align: left;
  margin-left: 30px;
}

.answer {
  margin-right: 10px;
  text-align: left
}

.difficultCollegeProcessAnswer {
  width: 400px;
  display: flex;
  align-items: left;
  margin-left: 150px;
  flex-direction: column;
}

</style>
