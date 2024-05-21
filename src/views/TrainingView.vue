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
            @click="showTopicTraining(subjectType.key)"
            class="subject-types__header-type"
            :class="subjectType.key === currentTopic ? 'is-selected' : null"
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
          data-testid="subject-certifications"
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

        <accordion-item
          :label="computedSubjectsHeader.header"
          :sublabel="computedSubjectsHeader.subheader"
          buttonSize="large"
          v-if="currentSubject.computedSubjects.length > 0"
        >
          <additional-subjects-drop-down
            :headers="additionalSubjectsColHeaders"
            :certData="currentSubject.computedSubjects"
            :dropDownType="'computed'"
          />
        </accordion-item>
      </template>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import AccordionItem from '@/components/AccordionItem.vue'
import TrainingDropDown from '@/components/TrainingDropDown.vue'
import SubjectCertsDropDown from '@/components/SubjectCertsDropDown.vue'
import AdditionalSubjectsDropDown from '@/components/AdditionalSubjectsDropDown.vue'
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
      currentTopic: '',
    }
  },

  async created() {
    if (Object.entries(this.training).length === 0)
      await this.$store.dispatch('subjects/getTrainingSubjects')
    else this.setInitialTopic()
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      isFetchingTraining: (state) => state.subjects.isFetchingTraining,
      fetchingTrainingError: (state) => state.subjects.fetchingTrainingError,
    }),
    ...mapGetters({
      training: 'subjects/activeTraining',
    }),
    currentSubject() {
      return this.training[this.currentTopic]
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
      return ['Subject', 'Alternative Certifications', '']
    },
    additionalSubjectsAccordionHeader() {
      return {
        header: 'Additional Subjects',
        subheader: `We're always improving our training, here's a list of older certifications that will unlock subjects. We'd still recommend getting your new certifications as our training has improved!`,
      }
    },
    computedSubjectsHeader() {
      if (this.currentTopic === 'math')
        return {
          header: 'Integrated Math',
          subheader: 'Click here to learn more about Integrated Math',
        }
      else
        return {
          header: 'Computed Subjects',
          subheader:
            'These are subjects that require multiple certifications to be completed',
        }
    },
    subjectTypes() {
      return (
        this.training.subjectTypes?.filter(
          (subjectType) =>
            this.training[subjectType.key].certifications.length > 0
        ) || []
      )
    },
  },
  methods: {
    showTopicTraining(topic) {
      this.currentTopic = topic
    },
    setInitialTopic() {
      this.currentTopic = this.subjectTypes[0].key
    },
  },
  watch: {
    'training.subjectTypes'(newValue, oldValue) {
      const nowLoaded = newValue && !oldValue
      if (nowLoaded) this.setInitialTopic()
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
