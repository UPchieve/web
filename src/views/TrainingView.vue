<template>
  <div v-if="user.isVolunteer" class="training-view">
    <div class="body-container">
      <div class="body-header">Volunteer Training and Certifications</div>
      <p class="instructions">
        On this page you can explore the training and certifications required
        for each school subject that we offer. Start by selecting a subject
        (Math, Science, etc.) and review both the required training and
        certifications. Once you complete the required training and at least one
        certification per subject, then you'll be able to start tutoring for
        that subject.
      </p>
      <loader
        v-if="isFetchingTraining"
        class="loader--center"
        :height="40"
        :width="40"
      />
      <p v-else-if="fetchingTrainingError" class="error">
        We had trouble loading the training material. Please try refreshing the
        page.
      </p>
      <template v-else>
        <div class="subject-types">
          <p
            v-for="subjectType in subjectTypes"
            :key="subjectType.key"
            @click="showSubjectTraining(subjectType.key)"
            class="subject-types__header-type"
            :class="
              subjectType.key === currentSubjectType ? 'is-selected' : null
            "
          >
            {{ subjectType.displayName }}
          </p>
        </div>

        <accordion-item
          label="Training Courses"
          sublabel="Complete the training in order to begin tutoring students"
          buttonSize="large"
          :alertMessage="requiredTrainingMessage"
        >
          <training-drop-down
            :headers="['Training', 'Progress', 'Actions']"
            :certData="currentSubject.training"
            trainingCourse
          />
        </accordion-item>

        <accordion-item
          label="Subject Certifications"
          sublabel="Complete at least 1 certification quiz in order to begin tutoring students"
          buttonSize="large"
        >
          <subject-certs-drop-down
            :headers="['Certification', 'Subjects Unlocked', 'Actions']"
            :certData="currentSubject.certifications"
          />
        </accordion-item>

        <accordion-item
          :label="additionalSubjectsAccordionHeader.header"
          :sublabel="additionalSubjectsAccordionHeader.subheader"
          buttonSize="large"
          v-if="currentSubject.additionalSubjects.length > 0"
        >
          <additional-subjects-drop-down
            :headers="additionalSubjectsColHeaders"
            :certData="currentSubject.additionalSubjects"
          />
        </accordion-item>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import AccordionItem from '@/components/AccordionItem'
import TrainingDropDown from '@/components/TrainingDropDown'
import SubjectCertsDropDown from '@/components/SubjectCertsDropDown'
import AdditionalSubjectsDropDown from '@/components/AdditionalSubjectsDropDown'
import Loader from '@/components/Loader.vue'

export default {
  name: 'Training',
  components: {
    AccordionItem,
    TrainingDropDown,
    SubjectCertsDropDown,
    AdditionalSubjectsDropDown,
    Loader,
  },
  data() {
    return {
      currentSubjectType: 'math',
    }
  },

  async created() {
    if (Object.entries(this.training).length === 0)
      await this.$store.dispatch('subjects/getTrainingSubjects')
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      training: state => state.subjects.training,
      isFetchingTraining: state => state.subjects.isFetchingTraining,
      fetchingTrainingError: state => state.subjects.fetchingTrainingError,
    }),
    ...mapGetters({
      isVolunteerCollegeRevampActive:
        'featureFlags/isVolunteerCollegeRevampActive',
      isVolunteerEnglishRevampActive:
        'featureFlags/isVolunteerEnglishRevampActive',
    }),
    currentSubject() {
      const currentTrainingSubject = this.training[this.currentSubjectType]

      // TODO: remove in volunteer-college-revamp feature flag cleanup
      if (
        this.isVolunteerCollegeRevampActive &&
        this.currentSubjectType === 'college'
      ) {
        const subjectsToShow = [
          'collegePrep',
          'collegeList',
          'collegeApps',
          'applicationEssays',
          'financialAid',
        ]
        currentTrainingSubject.certifications = currentTrainingSubject.certifications.filter(
          training => subjectsToShow.includes(training.key)
        )
      } else if (
        !this.isVolunteerCollegeRevampActive &&
        this.currentSubjectType === 'college'
      ) {
        const subjectsToShow = ['applications', 'planning', 'essays']
        currentTrainingSubject.certifications = currentTrainingSubject.certifications.filter(
          training => subjectsToShow.includes(training.key)
        )
      }

      // TODO: remove in volunteer-english-revamp feature flag cleanup
      if (
        this.isVolunteerEnglishRevampActive &&
        this.currentSubjectType === 'readingWriting'
      ) {
        const subjectsToShow = ['reading', 'essayPlanning', 'essayFeedback']
        currentTrainingSubject.certifications = currentTrainingSubject.certifications.filter(
          training => subjectsToShow.includes(training.key)
        )
      } else if (
        !this.isVolunteerEnglishRevampActive &&
        this.currentSubjectType === 'readingWriting'
      ) {
        const subjectsToShow = ['reading', 'humanitiesEssays']
        currentTrainingSubject.certifications = currentTrainingSubject.certifications.filter(
          training => subjectsToShow.includes(training.key)
        )
      }

      return currentTrainingSubject
    },
    // get the amount of required training material a user must complete
    requiredTrainingMessage() {
      let amount = 0
      for (let subject of this.currentSubject.training) {
        if (!this.user.certifications[subject.key].passed) amount++
      }

      if (!amount) return ''
      if (amount === 1) return `${amount} course required`
      return `${amount} courses required`
    },
    additionalSubjectsColHeaders() {
      if (this.currentSubjectType === 'college')
        return ['Subject', 'Required Training', '']
      else return ['Subject', 'Required Certifications', '']
    },
    additionalSubjectsAccordionHeader() {
      if (this.currentSubjectType === 'math')
        return {
          header: 'Integrated Math',
          subheader: 'Click here to learn more about Integrated Math',
        }
      else
        return {
          header: 'Additional Subjects',
          subheader:
            'Tutor for these subjects automatically by completing the required training courses',
        }
    },
    subjectTypes() {
      return this.training.subjectTypes
    },
  },
  methods: {
    showSubjectTraining(subject) {
      this.currentSubjectType = subject
    },
  },
}
</script>

<style lang="scss" scoped>
.body-container {
  max-width: 1200px;
  width: 100%;
  border-radius: 8px;
  background: #fff;
  padding: 40px 15px 80px;

  @include breakpoint-above('large') {
    padding: 40px 40px 80px;
  }

  .body-header {
    font-size: 24px;
    font-weight: 500;
    text-align: left;
    margin: 0 0 20px 0;
  }
}

.training-view {
  padding: 10px;

  @include breakpoint-above('large') {
    padding: 40px;
  }
}

a {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.instructions {
  text-align: left;
  font-size: 16px;
  color: $c-secondary-grey;
}

.subject-types {
  @include flex-container(row, space-around, center);
  margin-top: 2em;
  text-align: center;

  &__header-type {
    flex-basis: 100%;
    padding-bottom: 0.8em;
    font-size: 16px;
    border-bottom: 4px solid transparent;

    &:hover {
      cursor: pointer;
    }
  }
}

.is-selected {
  border-bottom: 4px solid $c-success-green;
}

.loader--center {
  margin-top: 2em;
  text-align: center;
}

.error {
  color: $c-error-red;
}
</style>
