<template>
  <div
    :style="coverStyle"
    class="dashboard">
    <div class="header-container"/>
    <h1>Hello, {{ name }}!</h1>

    <template v-if="!user.isVolunteer">
      <div class="dashboard-body row">
        <div class="col-lg-6 video">
          <p><span class="intro_bold">New to UPchieve?</span>Watch the video to learn how to use our services.</p>
          <div class="video">
            <iframe
              width="480"
              height="280"
              src="https://www.youtube.com/embed/UOFFF5hOwdM"
              frameborder="0"
              allowfullscreen/>
          </div>
        </div>

        <div class="col-lg-6 help">
          <div class = "help-container">
            <h2>You can get help from an Academic Coach.</h2>
            <button
              class="btn getHelp"
              @click.prevent="getHelp()">Get help now</button>
            <div
              v-if="showHelpPopUp"
              :style="popUpStyle"
              class="getHelpPopUp">
              <span>Select a help topic.</span>
              <select
                v-model="pickedTopic"
                class="form-control topic">
                <option value="math">Math</option>
                <option value="college">College Counseling</option>
              </select>
              <select
                v-model="pickedSubtopic"
                class="form-control subtopic">
                <option
                  v-for="(subtopic, index) in subtopics[pickedTopic]"
                  :key="`subtopic-${index}`">{{ subtopic }}</option>
              </select>
              <div class="helpBtns">
                <button
                  v-if="showHelpPopUp"
                  class="btn helpCancel"
                  type="cancel"
                  @click.prevent="getHelpCancel()">Cancel</button>
                <button
                  v-if="showHelpPopUp"
                  class="btn helpNext"
                  type="next"
                  @click.prevent="getHelpNext()">Get help</button>
              </div>
            </div>
            <div class="disclaimer row">Disclaimer: UPchieve assumes no
            responsibility for the actions of its volunteers and strongly
            encourages students to follow internet safety practices at all times.
            In particular, please do not share personal or identifying information
            with volunteers.</div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="dashboard-body row">
        <div class="col-lg-6 video">
          <p><strong>New to UPchieve? </strong>Watch the video to learn how to use our services.</p>
          <div class="video">
            <iframe
              width="500"
              height="300"
              src="https://www.youtube.com/embed/TfjsjukrnB8"
              frameborder="0"
              allowfullscreen/>
          </div>
        </div>
        <div class="col-lg-6 help">
          <div class="help-container">
            <h2>You are ready to help!</h2>
            <div v-if="hasActiveSession()">
              <button class="btn getHelp" @click.prevent="rejoinHelpSession()">
                Rejoin your coaching session
              </button>
            </div>
            <div v-if="!hasActiveSession()">
              <p> Only students who are waiting for a volunteer will show up below.</p>
              <list-sessions/>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script>

import UserService from 'src/services/UserService';

import ListSessions from 'src/components/ListSessions';

export default {
  components: {
    ListSessions,
  },
  data() {
    const user = UserService.getUser() || {};
    const subtopics = {
      math: ['Algebra', 'Geometry', 'Trigonometry', 'Precalculus', 'Calculus'],
      esl: ['General Help'],
      college: ['Planning', 'Applications', 'Essays'],

      // Temporarily changing to single word labels
      // 'college': ['College Planning', 'Application Help','Essay Editing']

      // Temporarily removing science and standardized testing
      // 'science': ['Biology','Chemistry'],
      // 'standardizedtest': ['SAT']
    };
    return {
      user,
      name: user.firstname || 'student',
      popUpStyle: { },
      showHelpPopUp: false,
      pickedTopic: '',
      pickedSubtopic: '',
      subtopics,
      coverStyle: { },
    };
  },
  methods: {
    getHelp() {
      this.popUpStyle = {
        display: 'flex',
      };
      this.coverStyle = {
        background: 'rgba(0,0,0,0.10)',
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
      let topic = this.pickedTopic;
      let subTopic = this.pickedSubtopic;
      // Temp change all to math
      // topic = 'math';
      topic = topic.toLowerCase();
      subTopic = subTopic.toLowerCase();
      if (subTopic === 'general help') {
        subTopic = topic;
      }
      const linkName = `/session/${topic}/${subTopic}`;
      this.$router.push(linkName);
    },
  },
};
</script>

<style scoped>
.header-container {
  height: 250px;
  background-color: #525666;
  position: relative;
}

.col-xs-12 {
  width: inherit;
}

.header-container::after {
  content: "";
  display: inline-block;;
  width: 100%;
  height: 100%;
  background-image: url('../assets/dashboardHeader@2x.png');
  background-repeat: no-repeat;
  background-size: cover;
  position: absolute;
  bottom: 0px;
  right: 0;
}

.header-container {
  height: 50%;
}

h1 {
  position: absolute;
  top: 20%;
  left: 55%;
  margin: 0;
  text-align: center;
  font-size: 36px;
  line-height: 42px;
  font-weight: 400;
  z-index: 10;
  color: white;
}

h2 {
  text-align: center;
  margin: 20px;
}

h3 {
  text-weight: bold;
}

.col-lg-6 {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  padding: 0;
}

.col-lg-6.help {
  background-color: #E3F2FD;
  padding: 50px 0;
}

.col-lg-6.video {
  background-color: white;
  margin: 0;
}

.col-lg-6 p {
  padding: 20px 0 0 20px;
  text-align: center;
}

.video {
  margin: 0 5px;
}

.dashboard {
  height: inherit;
}

.dashboard-body {
  display: table;
  width: 100%;
  height: 50%;
  margin: 0;
}

.disclaimer {
  padding: 0 20px;
  font-size: 12px;
  margin: 20px;
}

.dashboard-body h2 {
  font-size: 24px;
  font-weight: 600;
}

.dashboard-body p {
  font-size: 16px;
  font-weight: 300;
  color: #333333;
  text-align: left;
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

.getHelpPopUp {
  display: none;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 500px;
  height: 300px;
  background: #FFFFFF;
  z-index: 5;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  margin: auto;
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

.help-container {
  width: 500px;
  height: 300px;
}

.intro_bold {
  font-weight: 600;
  margin-right: 4px;
}

.btn.getHelp {
  border-radius: 30px;
  width: 300px;
}

</style>
