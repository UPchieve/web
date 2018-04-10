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

    <div class="section" id="nickname">
      <div class="prompt">Your Nickname</div>
      <div class="answer" v-show="'nickname' !== activeEdit">{{ user.nickname }}</div>
      <input type="text" v-model="user.nickname" v-show="'nickname' === activeEdit">
      <button @click="editField('nickname')" class="sectionBtn">{{ fieldButtons.nickname }}</button>
    </div>

    <div class="section" id="email">
      <div class="prompt">Your Email</div>
      <div class="answer" v-show="'email' !== activeEdit">{{ user.email }}</div>
      <input type="text" v-model="user.email" v-show="'email' === activeEdit">
      <button @click="editField('email')" class="sectionBtn">{{ fieldButtons.email }}</button>
    </div>

    <div class="section" id="birthdate">
      <div class="prompt">Your Birthday</div>
      <div class="answer" v-show="'birthdate' !== activeEdit">{{ user.birthdate }}</div>
      <input type="date" v-model="user.birthdate" v-show="'birthdate' === activeEdit">
      <button @click="editField('birthdate')" class="sectionBtn">{{ fieldButtons.birthdate }}</button>
    </div>

    <div class="section" id="gender">
      <div class="prompt">Your Gender</div>
      <div class="answer" v-show="'gender' !== activeEdit">{{ user.gender }}</div>
      <input type="text" v-model="user.gender" v-show="'gender' === activeEdit">
      <button @click="editField('gender')" class="sectionBtn">{{ fieldButtons.gender }}</button>
    </div>

    <div class="section" id="race">
      <div class="prompt">Your Race</div>
      <div class="answer">
        <ul v-show="'race' !== activeEdit" v-for="item in user.race">
          <li>{{ item }}</li>
        </ul>
      </div>
    </div>

  </div>

  <div v-if="!user.isVolunteer">
    <div class="section" id="highschool">
      <div class="prompt">Your High School's Name</div>
      <div class="answer" v-show="'highschool' !== activeEdit">{{ user.highschool }}</div>
      <input type="text" v-model="user.highschool" v-show="'highschool' === activeEdit">
      <button @click="editField('highschool')" class="sectionBtn">{{ fieldButtons.highschool }}</button>
    </div>

    <div class="section" id="expectedGraduation">
      <div class="prompt">Expected High School Graduation</div>
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

  </div>
  <div v-if="user.isVolunteer">
    <div class="section" id="phone">
      <div class="prompt">Your Phone Number
      </div>
      <div class="answer" v-show="'phone' !== activeEdit">{{ user.phone }}</div>
      <input type="text" v-model="user.phone" v-show="'phone' === activeEdit">
      <button @click="editField('phone')" class="sectionBtn">{{ fieldButtons.phone }}</button>
    </div>
    <div class="description">We will use this number to send
    you notifications when a student needs help. You will only receive
    notifications during the periods that you select in your schedule.</div>

    <div class="section" id="college">
      <div class="prompt" v-show="'favoriteAcademicSubject' !== activeEdit">Your College</div>
      <div class="answer" v-show="'college' !== activeEdit">{{ user.college }}</div>
      <input type="text" v-model="user.college" v-show="'college' === activeEdit">
      <button @click="editField('college')" class="sectionBtn">{{ fieldButtons.college }}</button>
    </div>

    <div class="section" id="favoriteAcademicSubject">
      <div class="prompt">Your Favorite Academic Subject</div>
      <div class="answer" v-show="'favoriteAcademicSubject' !== activeEdit">{{ user.favoriteAcademicSubject }}</div>
      <input type="text" v-model="user.favoriteAcademicSubject" v-show="'favoriteAcademicSubject' === activeEdit">
      <button @click="editField('favoriteAcademicSubject')" class="sectionBtn">{{ fieldButtons.favoriteAcademicSubject }}</button>
    </div>

    <div class="section" id="referred">
      <div class="prompt">Were you referred by one of our partner organizations?</div>
      <div class="answer" v-show="'referred' !== activeEdit">{{ user.referred }}</div>
      <select class="form-control" v-model="user.referred" v-show="'referred' === activeEdit">
        <option></option>
        <option>Yes - APO Xi Alpha</option>
        <option>Yes - Alpha Gamma Iota</option>
        <option>No</option>
      </select>
      <button @click="editField('referred')" class="sectionBtn">{{ fieldButtons.referred }}</button>
    </div>
  </div>

  <div v-if="user.isVolunteer" class="cert-info">
    <div class="info-header cert">Certifications</div>
    <div class="certifications" v-for="(value, key) in certifications">
      <div v-if="value">{{ key }}</div>
    </div>
  </div>

  <div class="section"><router-link to="resetpassword" class="prompt">Reset password</router-link></div>

</div>

</template>

<script>
import UserService from 'src/services/UserService'

export default {
  data() {
    var user = UserService.getUser();
    var avatarUrl = user.picture || (user.isVolunteer ? 'static/defaultavatar4.png' : 'static/defaultavatar3.png');
    var fieldnames = ['firstname', 'lastname', 'nickname', 'email', 'birthdate', 'gender', 'highschool', 'currentGrade',
    'expectedGraduation', 'difficultAcademicSubject', 'difficultCollegeProcess',
    'hasGuidanceCounselor', 'gpa', 'collegeApplicationsText', 'phone', 'favoriteAcademicSubject', 'college','referred'];
    var fieldButtons = [];
    fieldnames.map(function(field) {
      fieldButtons[field] = 'Edit';
    });
    var certifications = new Object();
    if (user.algebra) {
      if (user.algebra.passed) {
        certifications['Math: Algebra'] = true;
      }
    }
    if (user.geometry) {
      if (user.geometry.passed) {
        certifications['Math: Geometry'] = true;
      }
    }
    if (user.trigonometry) {
      if (user.trigonometry.passed) {
        certifications['Math: Trigonometry'] = true;
      }
    }
    if (user.precalculus) {
      if (user.precalculus.passed) {
        certifications['Math: Precalculus'] = true;
      }
    }
    if (user.calculus) {
      if (user.calculus.passed) {
        certifications['Math: Calculus'] = true;
      }
    }
    if (user.esl) {
      if (user.esl.passed) {
        certifications['ESL'] = true;
      }
    }

    return {
      user: user,
      activeEdit: null,
      fieldButtons: fieldButtons,
      saveBtnMsg: 'Save Profile',
      name: user.firstname || (user.isVolunteer ? 'volunteer' : 'student'),
      avatarStyle: {
        backgroundImage: `url(${avatarUrl})`
      },
      certifications: certifications
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
  margin: 0;
  font-size: 24px;
  border-bottom: 0.5px solid #CCCCCF;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
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
  padding-bottom: 20px;
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

.basic-info {
  display: flex;
  flex-direction: column;
  align-items: left;
  margin-top: 30px;
}

.info-header {
  display: flex;
  align-items: center;

  margin-left: 30px;
  font-size: 20px;
  font-weight: 600;
}

.info-header.basic {
  height: 60px;
}

.info-header.cert {
  margin-bottom: 15px;
}

.certifications {
  display: flex;
  align-items: center;
  height: 60px;
  width: 300px;
  text-align: left;
  margin-left: 30px;
}

.cert-info {
  border-top: 0.5px solid #CCCCCF;
  padding-top: 30px;
}

ul {
  padding: 15px;
}

.description {
  font-size: 12px;
  max-width: 500px;
  margin-left: 30px;
  margin-bottom: 20px;
  text-align: left;
}

</style>
