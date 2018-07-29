<template>
<div class="profile">
  <div class="header">
    Profile
    <button @click="editProfile()" class="editBtn btn">{{ editBtnMsg }}</button>
  </div>
  <div class="wrap-container">
    <div class="personal-info contain">
      <div class="subheader">Personal Information</div>
      <div class="container-content">

        <div class="container-section" id="email">
          <div class="prompt">Your Email</div>
          <div class="answer">{{ user.email }}</div>
        </div>

        <div v-if="!user.isVolunteer">
          <div class="container-section" id="highschool">
            <div class="prompt">Your High School's Name</div>
            <div class="answer" v-show="!activeEdit">{{ user.highschool }}</div>
            <input type="text" v-model="user.highschool" v-show="activeEdit" class="form-control">
          </div>

          <div class="container-section" id="expectedGraduation">
            <div class="prompt">Expected High School Graduation</div>
            <div class="answer" v-show="!activeEdit">{{ user.expectedGraduation }}</div>
            <select class="form-control" v-model="user.expectedGraduation" v-show="activeEdit">
              <option></option>
              <option>2017</option>
              <option>2018</option>
              <option>2019</option>
              <option>2020</option>
              <option>2021</option>
              <option>2022</option>
            </select>
          </div>
        </div>
        <div v-if="user.isVolunteer">
          <div class="container-section" id="phone">
            <div class="prompt">Your Phone Number
            </div>
            <div class="answer" v-show="!activeEdit">{{ user.phone }}</div>
            <input type="text" v-model="user.phone" v-show="activeEdit" class="form-control" >

            <div class="description">We will use this number to send
            you notifications when a student needs help. You will only receive
            notifications during the periods that you select in your schedule.</div>
          </div>

          <div class="container-section" id="preferredContactMethod">
            <div class="prompt">What is your preferred method of contact?</div>
            <div class="answer">
              <ul v-show="!activeEdit" v-for="item in user.preferredContactMethod">
                <li>{{ item }}</li>
              </ul>
            </div>
            <ul class="row form-control" v-model="user.preferredContactMethod" v-show="activeEdit">
              <p>Please select all that apply.</p>
              <div>
                <div class="checkbox">
                  <label>
                    <input type="checkbox" value="Email" v-model="user.preferredContactMethod">
                    Email
                  </label>
                </div>
                <div class="checkbox">
                  <label>
                    <input type="checkbox" value="Text message" v-model="user.preferredContactMethod">
                    Text message
                  </label>
                </div>
                <div class="checkbox">
                  <label>
                    <input type="checkbox" value="None" v-model="user.preferredContactMethod">
                    None
                  </label>
                </div>
              </div>
            </ul>
          </div>

          <div class="container-section" id="college">
            <div class="prompt">Your College</div>
            <div class="answer" v-show="!activeEdit">{{ user.college }}</div>
            <input type="text" v-model="user.college" v-show="activeEdit" class="form-control">
          </div>

          <div class="container-section" id="favoriteAcademicSubject">
            <div class="prompt">Your Favorite Academic Subject</div>
            <div class="answer" v-show="!activeEdit">{{ user.favoriteAcademicSubject }}</div>
            <input type="text" v-model="user.favoriteAcademicSubject" v-show="activeEdit" class="form-control">
          </div>

        </div>

        <div class="container-section resetBtn btn"><router-link to="resetpassword" class="prompt">Reset password</router-link></div>
      </div>

    </div>

    <div v-if="user.isVolunteer" class="cert-info contain">
      <div class="subheader">Certifications</div>
      <div class="container-content">
        <div class="certifications" v-for="(value, key) in certifications">
          <div v-if="value">{{ key }}</div>
        </div>
      </div>
    </div>

    <div class="profile-pic contain" v-if="false">
      <div class="subheader">Profile Picture</div>
      <div class="container-content">
        <div class="container-section" id="profilePic">
          <div class="answer avatar" v-bind:style="avatarStyle">
          </div>
        </div>
      </div>
    </div>

  </div>
</div>

</template>

<script>
import UserService from 'src/services/UserService'

export default {
  data() {
    var user = UserService.getUser();
    var avatarUrl = user.picture || (user.isVolunteer ? 'static/defaultavatar4.png' : 'static/defaultavatar3.png');
    var fieldnames = ['firstname', 'lastname', 'nickname', 'highschool', 'currentGrade',
    'expectedGraduation', 'difficultAcademicSubject', 'difficultCollegeProcess',
    'hasGuidanceCounselor', 'gpa', 'collegeApplicationsText', 'phone', 'favoriteAcademicSubject', 'college', 'referred', 'preferredContactMethod'];

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
      activeEdit: false,
      editBtnMsg: 'Edit Profile',
      name: user.firstname || (user.isVolunteer ? 'volunteer' : 'student'),
      avatarStyle: {
        backgroundImage: `url(${avatarUrl})`
      },
      certifications: certifications
    }
  },
  methods: {
    editProfile() {
      if (this.activeEdit) {
        UserService.setProfile(this, this.user);
        this.editBtnMsg = 'Edit Profile';
        this.activeEdit = false;
      } else {
        this.editBtnMsg = 'Save Profile';
        this.activeEdit = true;
      }
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

.editBtn {
  font-size: 20px;
  font-weight: 600;
  color: #343440;
  background-color: #FFF;
}

.editBtn:active, .editBtn:hover {
  background-color: #FFF;
  color: #16D2AA;
  box-shadow: none;
  margin: 0px;
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

ul {
  padding: 15px;
  height: 100%;
  margin: auto;
}

.wrap-container {
  display: flex;
  flex-wrap: wrap;
}

.contain {
  margin: 30px 0 0 30px;
  width: 475px;
}

.container-content {
  background-color: #F0F8FD;
  padding: 30px;
  text-align: left;
}

.subheader {
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  background-color: #E3F2FD;
  font-size: 20px;

}

.container-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
}

ul {
  padding: 0px;
}

.answer {
  font-weight: 600;
}

.answer ul {
  margin-left: 20px;
}

.description {
  margin-top: 15px;
  font-size: 12px;
}

.form-control {
  border: none;
  box-shadow: none;
  border-radius: 0;
  background-color: #F0F8FD;
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

.cert-info {
  margin-bottom: 30px;
}

.resetBtn {
  background-color: #16D2AA;
  border-radius: 30px;
  width: 200px;
  align-items: center;
  height: 50px;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.resetBtn a {
  color: #2C3E50;
}

.resetBtn a:hover {
  color: white;
  text-decoration: none;
}

</style>
