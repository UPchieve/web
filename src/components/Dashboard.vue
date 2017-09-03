<template>
  <div class="dashboard" v-bind:style="coverStyle">
    <div class="header-container">
      <div class="header">
        <h1>Welcome,<br />{{name}}.</h1>
      </div>
    </div>

    <template v-if="!user.isVolunteer">
      <div class="dashboard-body row">
        <div class="col-lg-6">
          <h2>New to UPchieve?</h2>
          <p>Watch the video to learn how to use our services.</p>
          <div class="video">
          <iframe width="500" height="300" src="https://www.youtube.com/embed/UOFFF5hOwdM" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>

        <div class="col-lg-6">
          <h2>Get started!</h2>
          <p>Our volunteers are here to help you.</p>
          <button class="btn getHelp" @click.prevent="getHelp()">Get help from a tutor!</button>
          <div class="getHelpPopUp" v-bind:style="popUpStyle" v-if="showHelpPopUp">
            <span>Select a help topic.</span>
            <select class="form-control topic" v-model="pickedTopic">
              <option value="math">Math</option>
              <option value="college">College Counseling</option>
            </select>
            <select class="form-control subtopic" v-model="pickedSubtopic">
              <option v-for="subtopic in subtopics[pickedTopic]">{{ subtopic }}</option>
            </select>
            <div class="helpBtns">
              <button class="btn helpCancel" type="cancel" @click.prevent="getHelpCancel()" v-if="showHelpPopUp">Cancel</button>
              <button class="btn helpNext" type="next" @click.prevent="getHelpNext()" v-if="showHelpPopUp">Get help</button>
            </div>
          </div>
          <div class="disclaimer row">
            <p><h3> Disclaimer:</h3> The UPchieve team will do its best to screen and train all volunteers prior to allowing them to work with students. (To learn more about how we screen and train volunteers please visit the <a href="http://www.upchieve.org/faq" target="_blank" > “FAQ” </a> section of our website). However, we lack the necessary resources to adequately vet all volunteers and make no representations regarding the intentions or capabilities of any such volunteers. Consequently, UPchieve assumes no responsibility for the actions of volunteers. The UPchieve team strongly encourages students to follow Internet safety practices at all times. In particular, students should not share personal or identifying information with volunteers. (For more information on recommended  Internet safety practices for teens, please refer to <a href="http://teens.webmd.com/features/teen-internet-safety-tips" target="_blank" > this WebMD article. </a></p>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="dashboard-body row">
        <div class="col-lg-6">
          <h2>New to UPchieve?</h2>
          <p>Watch the video to learn how to use our services.</p>
          <div class="video">
          <iframe width="500" height="300" src="https://www.youtube.com/embed/TfjsjukrnB8" frameborder="0" allowfullscreen></iframe>
          </div>
        </div>
        <div class="col-lg-6">
          <h2>Select a student to help</h2>
          <p> Only students who are waiting for a volunteer will show up below.</p>
          <list-sessions></list-sessions>
        </div>
      </div>
    </template>
    </div>
  </div>
</template>

<script>

import UserService from 'src/services/UserService';

import ListSessions from 'src/components/ListSessions';

export default {
  components: {
    ListSessions
  },
  data() {
    let user = UserService.getUser() || {};
    var subtopics = new Object();
    subtopics['math'] = ['Algebra', 'Geometry', 'Trigonometry', 'Precalculus', 'Calculus'];
    subtopics['esl'] = ['ESL'];
    subtopics['college'] = ['General help'];
    return {
      user: user,
      name: user.firstname || 'student',
      popUpStyle: { },
      showHelpPopUp: false,
      pickedTopic: '',
      pickedSubtopic: '',
      subtopics: subtopics,
      coverStyle: { }
    }
  },
  methods: {
    getHelp() {
      this.popUpStyle = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        width: '500px',
        height: '300px',
        background: '#FFFFFF',
        zIndex: '5',
        position: 'fixed',
        top: '0',
        bottom: '0',
        left: '0',
        right: '0',
        margin: 'auto'
      };
      this.coverStyle = {
        background: 'rgba(0,0,0,0.10)'
      };
      this.showHelpPopUp = true;
    },
    capitalize(string) {
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    getHelpCancel() {
      this.popUpStyle = { };
      this.coverStyle = { };
      this.showHelpPopUp = false;
    },
    getHelpNext() {
      var topic = this.pickedTopic;
      topic = topic.toLowerCase();
      var linkName = '/session/' + topic;
      this.$router.push(linkName);
    }
  }
}
</script>

<style scoped>
.header-container {
  height: 250px;
  background-color: #525666;
  position: relative;
}

.header-container::after {
  content: "";
  z-index: 2;
  display: inline-block;;
  width: 451px;
  height: 232px;
  background-image: url('../assets/dashboardHeader@2x.png');
  background-size: 451px 232px;
  position: absolute;
  bottom: 0px;
  right: 0;
}

.header {
  height: 210px;
  background-color: #64E1C6;
  padding-top: 83px;
  padding-left: 45px;
}

h1 {
  margin: 0;
  text-align: left;
  font-size: 36px;
  line-height: 42px;
  font-weight: 400;
}

h3 {
  text-weight: bold;
}

.col-lg-6 {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.dashboard-body {
  padding: 20px 30px;
}

.disclaimer {
  padding: 0 20px;
}

.dashboard-body h2 {
  font-size: 24px;
  font-weight: 600;
  text-align: left;
}

.dashboard-body p {
  font-size: 16px;
  font-weight: 300;
  color: #333333;
  text-align: left;
}

.video {
  background-color: #EEEEEE;
}

.btn {
  height: 60px;
  background-color: #16D2AA;
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: white;
  line-height: 40px;
}

.btn:hover {
  background-color: #16D2AA;
}

.form-control {
  width: 300px;
  margin-bottom: 20px;
}

.getHelpPopUp span {
  margin-bottom: 20px;
}

.helpBtns {
  display: flex;
}

.helpCancel, .helpNext {
  margin: 0 20px;
}

</style>
