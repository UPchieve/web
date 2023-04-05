<template>
  <modal
    :closeModal="handleCloseModal"
    class="volunteer-welcome-modal-wrapper"
    backText="Dashboard"
  >
    <img
      class="volunteer-welcome-modal-header-img"
      src="@/assets/volunteer-welcome-modal-header.png"
      alt="image welcoming new volunteers"
    />
    <div class="volunteer-welcome-modal">
      <div class="volunteer-welcome-modal-title-container">
        <h1 class="volunteer-welcome-modal-title">
          Welcome {{ user.firstname }}!
        </h1>
        <p class="volunteer-welcome-modal-subtitle">
          {{ message }}
        </p>
      </div>

      <div class="uc-column pick-subjects" v-if="isFastTrackedUser">
        <label for="fast-track-question" class="uc-form-label"
          >Which subject are you ready to teach?</label
        >
        <v-select
          id="fast-track-question"
          class="uc-form-select"
          v-model="fastTrackSubject"
          :options="subjectsAndTopics"
          label="subjectDisplayName"
          :searchable="true"
          :clearable="false"
          required
          :reduce="option => option.subject"
        />
      </div>

      <button
        @click="handleCloseModal"
        class="volunteer-welcome-modal-btn"
        type="button"
        :disabled="isFastTrackedUser ? !fastTrackSubject : false"
      >
        Get started <arrow-icon class="volunteer-welcome-modal-arrow-icon" />
      </button>
    </div>
  </modal>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import ArrowIcon from '@/assets/arrow.svg'
import Modal from '@/components/Modal'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import Case from 'case'

export default {
  name: 'volunteer-welcome-modal',
  components: { Modal, ArrowIcon },
  props: {
    closeModal: { type: Function, required: true },
    loadSessionsList: { type: Function, required: true },
  },
  data() {
    return {
      fastTrackSubject: '',
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isFastTrackedUserActive: 'featureFlags/isFastTrackedUserActive',
    }),
    isFastTrackedUser() {
      return (
        this.isFastTrackedUserActive &&
        !this.user.pastSessions.length &&
        (!this.user.isOnboarded || !this.user.isApproved)
      )
    },
    message() {
      if (this.user.isApproved)
        return "We're so glad you're joining our movement to democratize access to educational support. Before you can start making an impact in a student’s life, you'll need to complete a few quick steps."
      else if (this.isFastTrackedUser)
        return `Pick the subject you are ready to teach. As soon as you push Get Started, we'll find you a student to connect with.`
      else
        return "We're so glad you're joining our movement to democratize access to educational support. Before you can start making an impact in a student’s life, you'll need to complete a few quick steps."
    },
    // TODO: remove with the isFastTrackedUserActive feature flag cleanup
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
  },

  methods: {
    handleCloseModal() {
      this.$store.dispatch('user/firstDashboardVisit', false)
      if (this.isFastTrackedUser && this.fastTrackSubject) {
        const data = this.subjectsAndTopics.find(
          option => option.subject === this.fastTrackSubject
        )
        const url = `https://app.upchieve.org/session/${Case.kebab(
          data.topic
        )}/${Case.kebab(data.subject)}`
        AnalyticsService.captureEvent(EVENTS.VOLUNTEER_FAST_TRACKED, {
          event: EVENTS.VOLUNTEER_FAST_TRACKED,
          request_url: url,
        })

        // set fake loader on the session list
        this.loadSessionsList()
      }
      this.closeModal()
    },
  },
}
</script>

<style lang="scss">
// override styling defined in the Modal component to allow for image spread
.volunteer-welcome-modal-wrapper .upc-modal-form {
  padding: 0;
  overflow: visible;
}

.volunteer-welcome-modal-wrapper .upc-modal-form img {
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
}

.volunteer-welcome-modal-wrapper #vs2__listbox {
  max-height: 200px;
}

.volunteer-welcome-modal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above('medium') {
    @include child-spacing(top, 16px);
  }

  &-title {
    @include font-category('display-small');
    @include breakpoint-above('medium') {
      margin-top: 24px;
    }
  }

  &-title-container {
    margin: 0 auto;
    width: 80%;
  }

  &-subtitle {
    font-size: 16px;
    color: $c-secondary-grey;
  }

  &-header-img {
    width: 100%;
  }

  &-arrow-icon {
    fill: currentColor;
    height: 16px;
    width: 16px;
    margin-left: 0.5em;
  }

  // @todo: make global modal button styles
  &-btn {
    @include flex-container(row, center, center);
    width: 80%;
    background-color: $c-success-green;
    border-color: transparent;
    color: white;
    margin: 1em auto;
    border: 1px solid rgba(0, 0, 0, 0);
    border-radius: 20px;
    padding: 9px 23px;
    @include font-category('body');
    border: none;

    &:hover {
      background: darken($c-success-green, 5%);
      color: $c-background-grey;
    }

    @include breakpoint-above('medium') {
      width: 200px;
    }
  }
}

.pick-subjects {
  margin: 0 auto;
}

.volunteer-welcome-modal-btn:disabled {
  background-color: $c-disabled-grey;
}
</style>
