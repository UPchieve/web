<template>
  <div class="welcome-page">
    <div class="welcome-page-card">
      <div class="welcome-page-card-content">
        <div class="welcome-page-title-container">
          <h1 class="welcome-page-title">
            {{ userCreatedBeforeLaunch ? 'Hi' : 'Welcome' }}
            {{ user.firstname }} 👋
          </h1>
          <p class="welcome-page-subtitle">
            {{
              userCreatedBeforeLaunch
                ? "We're so glad you're here!"
                : "We're trying something new 🙂"
            }}
          </p>
        </div>
        <div
          class="certification-instructions-container"
          v-if="!hasCertification"
        >
          <p class="">
            Let's get certified to tutor! Pass a short quiz in your favorite
            subject.
          </p>
          <p class="">
            (Unlimited attempts! 😊)
          </p>
          <div class="pick-subjects">
            <v-select
              id="fast-track-question"
              class="uc-form-select welcome-page-subject-select"
              v-model="subjectSelection"
              label="subjectDisplayName"
              :options="subjectsAndTopics"
              :searchable="true"
              :clearable="false"
              required
              :reduce="option => option.subject"
              placeholder="Select a subject"
            />
          </div>
          <button
            @click="handleTrainingRedirect"
            class="welcome-page-btn"
            type="button"
            :disabled="!subjectSelection"
          >
            Take the quiz
          </button>
        </div>
        <div
          class="certification-instructions-container"
          v-else-if="!passedUpchieve101"
        >
          <p class="">
            {{
              completed101Training
                ? 'Put your knowledge to the test and pass our training quiz!'
                : 'Next up: take our training to learn how to provide impactful coaching for every student on UPchieve!'
            }}
          </p>
          <button
            @click="handle101Redirect"
            class="welcome-page-btn"
            type="button"
          >
            {{
              completed101Training
                ? 'Start UPchieve 101 quiz'
                : inProgress
                ? 'Resume course'
                : 'Start course'
            }}
          </button>
        </div>
      </div>
    </div>
    <cert-dog class="cert-dog" v-if="!mobileMode" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import CertDog from '@/assets/certdog.svg'
import Case from 'case'

export default {
  name: 'welcome-page',
  components: {
    CertDog,
  },
  beforeMount() {
    this.$store.dispatch('app/sidebar/hide')
    this.$store.dispatch('app/header/hide')
  },
  data() {
    return {
      subjectSelection: '',
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      hasCertification: 'user/hasCertification',
      passedUpchieve101: 'user/passedUpchieve101',
    }),
    userCreatedBeforeLaunch() {
      const forcedTrainingLaunchDate = '2023-04-27T16:00:00.000Z'
      return (
        new Date(this.user.createdAt).getTime() <=
        new Date(forcedTrainingLaunchDate).getTime()
      )
    },
    subjectsAndTopics() {
      return [
        {
          subject: '8thGradeMath',
          subjectDisplayName: '8th Grade Math',
          topic: 'math',
        },
        {
          subject: 'prealgebra',
          subjectDisplayName: 'Prealgebra',
          topic: 'math',
        },
        {
          subject: 'algebraOne',
          subjectDisplayName: 'Algebra 1',
          topic: 'math',
        },
        {
          subject: 'algebraTwo',
          subjectDisplayName: 'Algebra 2',
          topic: 'math',
        },
        { subject: 'geometry', subjectDisplayName: 'Geometry', topic: 'math' },
        {
          subject: 'trigonometry',
          subjectDisplayName: 'Trigonometry',
          topic: 'math',
        },
        {
          subject: 'statistics',
          subjectDisplayName: 'Statistics',
          topic: 'math',
        },
        {
          subject: 'precalculus',
          subjectDisplayName: 'Precalculus',
          topic: 'math',
        },
        {
          subject: 'calculusAB',
          subjectDisplayName: 'Calculus AB',
          topic: 'math',
        },
        {
          subject: 'reading',
          subjectDisplayName: 'Reading',
          topic: 'readingWriting',
        },
        {
          subject: 'essayPlanning',
          subjectDisplayName: 'Essay Planning',
          topic: 'readingWriting',
        },
        {
          subject: 'essayFeedback',
          subjectDisplayName: 'Essay Feedback',
          topic: 'readingWriting',
        },
        { subject: 'biology', subjectDisplayName: 'Biology', topic: 'science' },
        {
          subject: 'chemistry',
          subjectDisplayName: 'Chemistry',
          topic: 'science',
        },
        {
          subject: 'physicsOne',
          subjectDisplayName: 'Physics 1',
          topic: 'science',
        },
        {
          subject: 'environmentalScience',
          subjectDisplayName: 'Environmental Science',
          topic: 'science',
        },
        {
          subject: 'usHistory',
          subjectDisplayName: 'U.S. History',
          topic: 'socialStudies',
        },
        {
          subject: 'collegePrep',
          subjectDisplayName: 'College Prep',
          topic: 'college',
        },
        {
          subject: 'collegeList',
          subjectDisplayName: 'College List',
          topic: 'college',
        },
        {
          subject: 'collegeApps',
          subjectDisplayName: 'Applications',
          topic: 'college',
        },
        {
          subject: 'applicationEssays',
          subjectDisplayName: 'Application Essays',
          topic: 'college',
        },
        {
          subject: 'financialAid',
          subjectDisplayName: 'Financial Aid',
          topic: 'college',
        },
        { subject: 'satMath', subjectDisplayName: 'SAT Math', topic: 'sat' },
        {
          subject: 'satReading',
          subjectDisplayName: 'SAT Reading',
          topic: 'sat',
        },
      ]
    },
    inProgress() {
      return (
        this.user.trainingCourses.upchieve101.progress > 0 &&
        !this.completed101Training
      )
    },
    completed101Training() {
      return this.user.trainingCourses.upchieve101.progress === 100
    },
  },

  methods: {
    handleTrainingRedirect() {
      this.$store.dispatch('user/firstDashboardVisit', false)
      if (this.subjectSelection) {
        const data = this.subjectsAndTopics.find(
          option => option.subject === this.subjectSelection
        )
        const path = `/training/${Case.kebab(data.subject)}/quiz`
        this.$router.push(path)
      }
    },
    handle101Redirect() {
      this.completed101Training
        ? this.$router.push('/training/upchieve101/quiz')
        : this.$router.push('/training/course/upchieve101')
    },
  },
}
</script>

<style lang="scss" scoped>
.welcome-page {
  background-color: #ecf1fa;
  @include flex-container(column, center, center);

  &-card {
    background-color: $upchieve-white;
    @include flex-container(column, initial, center);
    height: 100vh;

    @include breakpoint-above('small') {
      @include flex-container(column, center, center);
      margin-top: 6em;
      width: 80%;
      border-radius: 2em;
      height: initial;
    }

    @include breakpoint-above('medium') {
      width: 50%;
    }
  }

  &-card-content {
    @include flex-container(column, center, center);
    margin: 5em 0;
    width: 80%;
    border-radius: 2em;

    @include breakpoint-above('small') {
      width: 60%;
    }
  }

  &-title-container,
  .certification-instructions-container {
    text-align: center;
  }

  &-title-container {
    margin-bottom: 2em;
  }

  &-title {
    @include font-category('display-small');
    // @include breakpoint-above('medium') {
    //   margin-top: 4em;
    // }
  }

  &-subtitle {
    font-size: 16px;
    color: $c-secondary-grey;
    margin-bottom: 0em;
  }

  // @todo: make global modal button styles
  &-btn {
    @include flex-container(row, center, center);
    width: 100%;
    background-color: $c-success-green;
    border-color: transparent;
    color: white;
    margin-top: 1.6em;
    border: 1px solid rgba(0, 0, 0, 0);
    border-radius: 20px;
    padding: 9px 23px;
    @include font-category('body');
    border: none;

    &:hover {
      background: darken($c-success-green, 5%);
      color: $c-background-grey;
    }
  }

  &-subject-select::placeholder {
    color: $c-banned-grey;
  }
}

.welcome-page-btn:disabled {
  background-color: $c-disabled-grey;
}

.pick-subjects {
  width: 100%;
}

.cert-dog {
  position: absolute;
  right: 0;
  bottom: 0;
  height: 200px;

  @include breakpoint-above('medium') {
    height: 350px;
  }
}
</style>
