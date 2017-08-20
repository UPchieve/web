<template>
<div>
  <div class="profile-header">
      <h2>{{user.isVolunteer ? 'Volunteer' : 'Student' }} Profile</h2>
  </div>
  <div class="name">
    <div id="firstname">
      <span>First name:</span>
      <span v-show="'firstname' !== activeEdit">{{ user.firstname }}</span>
      <input type="text" v-model="user.firstname" v-show="'firstname' === activeEdit">
      <button @click="editField('firstname')">{{ fieldButtons.firstname }}</button>
    </div>
    <div id="lastname">
      <span>Last name:</span>
      <span v-show="'lastname' !== activeEdit">{{ user.lastname }}</span>
      <input type="text" v-model="user.lastname" v-show="'lastname' === activeEdit">
      <button @click="editField('lastname')">{{ fieldButtons.lastname }}</button>
    </div>
  </div>

  <div class="email">
    <span>Email address:</span>
    {{ user.email }}
  </div>

  <div><router-link to="resetpassword">Reset password</router-link></div>

  <div v-if="!user.isVolunteer">
    <div id="highschool">
      <span>High school:</span>
      <span v-show="'highschool' !== activeEdit">{{ user.highschool }}</span>
      <input type="text" v-model="user.highschool" v-show="'highschool' === activeEdit">
      <button @click="editField('highschool')">{{ fieldButtons.highschool }}</button>
    </div>

    <div class="currentGrade">
      <span>Current grade:</span>
      <span v-show="'currentGrade' !== activeEdit">{{ user.currentGrade }}</span>
      <select class="form-control" v-model="user.currentGrade" v-show="'currentGrade' === activeEdit">
        <option></option>
        <option>Freshman</option>
        <option>Sophomore</option>
        <option>Junior</option>
        <option>Senior</option>
      </select>
      <button @click="editField('currentGrade')">{{ fieldButtons.currentGrade }}</button>
    </div>

    <div class="expectedGraduation">
      <span>Expected graduation:</span>
      <span v-show="'expectedGraduation' !== activeEdit">{{ user.expectedGraduation }}</span>
      <select class="form-control" v-model="user.expectedGraduation" v-show="'expectedGraduation' === activeEdit">
        <option></option>
        <option>2017</option>
        <option>2018</option>
        <option>2019</option>
        <option>2020</option>
        <option>2021</option>
        <option>2022</option>
      </select>
      <button @click="editField('expectedGraduation')">{{ fieldButtons.expectedGraduation }}</button>
    </div>

    <div class="difficultAcademicSubject">
      <span>Most difficult academic subject:</span>
      <input type="text" v-model="user.difficultAcademicSubject" v-show="'difficultAcademicSubject' === activeEdit">
      <span v-show="'difficultAcademicSubject' !== activeEdit">{{ user.difficultAcademicSubject }}</span>
      <button @click="editField('difficultAcademicSubject')">{{ fieldButtons.difficultAcademicSubject }}</button>
    </div>

    <div class="difficultCollegeProcess">
      <span>Difficult aspects of the college process:</span>
      <div v-show="'difficultCollegeProcess' === activeEdit">
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
      <ul v-show="'difficultCollegeProcess' !== activeEdit" v-for="item in user.difficultCollegeProcess">
        <li>{{ item }}</li>
      </ul>
      <button @click="editField('difficultCollegeProcess')">{{ fieldButtons.difficultCollegeProcess }}</button>
    </div>

    <div class="hasGuidanceCounselor">
      <span>Have a guidance counselor:</span>
      <select class="form-control" v-model="user.hasGuidanceCounselor" v-show="'hasGuidanceCounselor' === activeEdit">
        <option></option>
        <option>Yes</option>
        <option>No</option>
        <option>I don't know</option>
      </select>
      <span v-show="'hasGuidanceCounselor' !== activeEdit">{{ user.hasGuidanceCounselor }}</span>
      <button @click="editField('hasGuidanceCounselor')">{{ fieldButtons.hasGuidanceCounselor }}</button>
    </div>

    <div class="gpa">
      <span>GPA:</span>
      <span v-show="'gpa' !== activeEdit">{{ user.gpa }}</span>
      <input type="text" v-model="user.gpa" v-show="'gpa' === activeEdit">
      <button @click="editField('gpa')">{{ fieldButtons.gpa }}</button>
    </div>

    <div class="collegeApplicationsText">
      <span>List all colleges and universities you are considering apply to:</span>
      <span v-show="'collegeApplicationsText' !== activeEdit">{{ user.collegeApplicationsText }}</span>
      <input type="text" v-model="user.collegeApplicationsText" v-show="'collegeApplicationsText' === activeEdit">
      <button @click="editField('collegeApplicationsText')">{{ fieldButtons.collegeApplicationsText }}</button>
    </div>
  </div>

  <button @click="saveProfile()">{{ saveBtnMsg }}</button>
</div>

</template>

<script>
import UserService from 'src/services/UserService'

export default {
  data() {
    var user = UserService.getUser();
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
      saveBtnMsg: 'Save Changes'
    }
  },
  methods: {
    editField: function(field) {
      if (field !== this.activeEdit) {
        this.activeEdit = field;
        this.fieldButtons[field] = 'Done';
        this.savBtnMsg = 'Save Changes';
      } else {
        this.activeEdit = null;
        this.fieldButtons[field] = 'Edit';
      }
    },
    saveProfile() {
      UserService.setProfile(this, this.user);
      this.saveBtnMsg = 'Changes saved!';
    }
  }
}
</script>

<style scoped>
</style>
