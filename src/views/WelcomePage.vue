<template>
  <div class="welcome-page" v-if="!hasCertification">
    <div class="welcome-page-card">
      <div class="welcome-page-card-content">
        <div class="welcome-page-title-container">
          <p
            class="welcome-page-progress"
            v-if="isAutoFlowProgressBarUser || isAutoFlowAvailabilityStepUser"
          >
            <span class="welcome-page-progress--step">Step 1 of 2:</span>
            Subject certification
          </p>
          <h1 class="welcome-page-title">Hi, {{ user.firstname }} 👋</h1>
        </div>
        <div>
          <p class="welcome-page-description">
            We're so glad you're here!
          </p>
          <p class="welcome-page-description">
            Let's get certified to tutor! Pass a short quiz in your favorite
            subject.
          </p>
          <p class="welcome-page-description">
            (Unlimited attempts! 😊)
          </p>
          <div class="welcome-page-topic-grid">
            <topic-chip
              v-for="(card, index) in topicCards"
              v-bind:key="index"
              :title="card.title"
              :svg="card.svg"
              :totalSubjects="card.subtopics.length"
              class="welcome-page-topic-chip"
              @click.native="() => handleTopicClick(card.topic)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
  <div
    class="welcome-page-step-two"
    v-else-if="isAutoFlowProgressBarUser || isAutoFlowAvailabilityStepUser"
  >
    <div class="welcome-page-step-two-card">
      <div class="welcome-page-step-two-card-content">
        <div class="welcome-page-step-two-title-container">
          <h1 class="welcome-page-step-two-title">
            Hi, {{ user.firstname }} 👋
          </h1>
          <p class="welcome-page-step-two-subtitle">
            We're so glad you're here!
          </p>
        </div>
        <div
          class="certification-instructions-container-step-two"
          v-if="isAutoFlowProgressBarUser"
        >
          <p class="">
            {{
              completed101Training
                ? 'Put your knowledge to the test and pass our training quiz!'
                : 'Next up: Take our training to learn how to provide impactful coaching for every student on UPchieve!'
            }}
          </p>
          <large-button
            @click.native="handle101Redirect"
            class="welcome-page-step-two-btn"
            type="button"
          >
            {{
              completed101Training
                ? 'Start UPchieve 101 quiz'
                : inProgress
                ? 'Resume course'
                : 'Start course'
            }}
          </large-button>
        </div>
        <div
          class="certification-instructions-container-step-two"
          v-else-if="isAutoFlowAvailabilityStepUser"
        >
          <p>
            Next up: Select at least 1 hour a week when you'd like to receive
            text messages about students requesting help.
          </p>
          <large-button
            @click.native="handleAvailabilityPageRedirect"
            class="welcome-page-step-two-btn"
            type="button"
          >
            Select availability
          </large-button>
        </div>
      </div>
    </div>
    <cert-dog class="cert-dog-step-two" v-if="!mobileMode" />
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import TopicChip from '@/components/TopicChip.vue'
import CertDog from '@/assets/certdog.svg'
import LargeButton from '@/components/LargeButton.vue'

export default {
  name: 'welcome-page',
  components: {
    TopicChip,
    CertDog,
    LargeButton,
  },
  async beforeMount() {
    this.$store.dispatch('app/sidebar/hide')
    this.$store.dispatch('app/header/hide')
    if (Object.entries(this.training).length === 0)
      await this.$store.dispatch('subjects/getTrainingSubjects')
  },
  data() {
    return {
      subjectSelection: '',
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      subjects: state => state.subjects.subjects,
      training: state => state.subjects.training,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      topicCards: 'subjects/quizTopicCards',
      isAutoFlowProgressBarUser: 'user/isAutoFlowProgressBarUser',
      isAutoFlowAvailabilityStepUser: 'user/isAutoFlowAvailabilityStepUser',
      hasCertification: 'user/hasCertification',
      passedUpchieve101: 'user/passedUpchieve101',
    }),
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
    handleTopicClick(topicName) {
      const topicCard = this.topicCards.find(card => card.topic === topicName)
      this.$store.dispatch('app/modal/show', {
        component: 'SubjectSelectionModal',
        data: {
          backText: 'Back',
          acceptText: 'Start quiz',
          topic: topicCard.topic,
          title: topicCard.title,
          subtopics: topicCard.subtopics,
          subtopicDisplayNames: topicCard.subtopicDisplayNames,
          svg: topicCard.svg,
          preSelectedSubtopic: topicCard.selectedSubtopic,
          trainingSelect: true,
          subtitle: 'Choose a subject to take a short quiz in.',
        },
      })
    },
    handle101Redirect() {
      this.completed101Training
        ? this.$router.push('/training/upchieve101/quiz')
        : this.$router.push('/training/course/upchieve101')
    },
    handleAvailabilityPageRedirect() {
      this.$router.push('/calendar')
    },
  },
}
</script>

<style lang="scss" scoped>
.welcome-page {
  @include flex-container(column, initial, center);
  background-color: $upchieve-white;
  height: 100%;

  &-card {
    @include flex-container(column, initial, center);
    background-color: $upchieve-white;

    @include breakpoint-above('small') {
      margin-top: 6em;
      width: 80%;
      border-radius: 2em;
    }

    @include breakpoint-above('medium') {
      width: 90%;
    }

    @include breakpoint-above('huge') {
      width: 80%;
    }

    @include breakpoint-above('massive') {
      width: 50%;
    }
  }

  &-card-content {
    margin: 5em 0;
    width: 80%;

    @include breakpoint-above('small') {
      width: 100%;
    }
  }

  &-title-container {
    margin-bottom: 2em;
  }

  &-title {
    @include font-category('display-small');
  }

  &-subtitle {
    @include font-category('body');
    color: $c-secondary-grey;
  }

  &-btn {
    width: 100%;
    margin-top: 1.5em;
  }

  &-topic-grid {
    margin-top: 2em;
    display: grid;
    grid-template-columns: 1fr;
    grid-row-gap: 1ch;
    grid-column-gap: 1.5em;
    justify-content: space-between;

    @include breakpoint-above('small') {
      grid-template-columns: 1fr 1fr;
    }

    @include breakpoint-above('large') {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  &-topic-chip {
    width: 100%;
    margin-bottom: 1em;
  }

  &-description {
    margin-bottom: 0;
  }

  &-progress {
    color: $c-information-blue;
    &--step {
      font-weight: 600;
    }
  }
}

// Styles are taken from the prevous v1 version of the WelcomePage
.welcome-page-step-two {
  background-color: #ecf1fa;
  @include flex-container(column, initial, center);
  height: 100%;

  &-card {
    background-color: $upchieve-white;
    @include flex-container(column, initial, center);
    height: 100vh;
    position: relative;
    z-index: 1;

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

    @include breakpoint-above('huge') {
      width: 40%;
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
  }

  &-subtitle {
    font-size: 16px;
    color: $c-secondary-grey;
    margin-bottom: 0em;
  }

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

.welcome-page-step-two-btn:disabled {
  background-color: $c-disabled-grey;
}

.cert-dog-step-two {
  position: absolute;
  right: 0;
  bottom: 0;
  height: 200px;
  z-index: 0;

  @include breakpoint-above('medium') {
    height: 350px;
  }

  @include breakpoint-above('huge') {
    right: 20%;
  }
}
</style>
