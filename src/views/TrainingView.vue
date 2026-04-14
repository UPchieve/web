<template>
  <div v-if="isVolunteer" class="training-view">
    <div class="certificate-container" v-if="canDownloadCertificate">
      <div class="certificate-icon-and-text">
        <div class="certificate-icon">
          <certificate-icon />
        </div>
        <div class="certificate-text-container">
          <div class="certificate-header">
            <check />
            <h1 class="certificate-heading">Nationally Certified Tutor</h1>
          </div>
          <div class="certificate-text">
            <p>
              You've completed UPchieve's training and proven you're ready to
              deliver high-quality academic support. Download your certification
              and showcase it on LinkedIn, your resume, or college applications.
            </p>
          </div>
        </div>
      </div>
      <div class="certificate-buttons">
        <button type="button" @click="downloadCertificate">
          <download-icon />
        </button>
      </div>
    </div>
    <div v-else class="certificate-container-disabled">
      <div class="certificate-icon-and-text">
        <div class="certificate-icon">
          <disabled-certificate-icon />
        </div>
        <div class="certificate-text-container">
          <div class="certificate-header">
            <h1 class="certificate-heading">Nationally Certified Tutor</h1>
          </div>
          <div>
            <p>
              Complete UPchieve's training course and pass a subject quiz to
              earn your official tutor certification.
            </p>
          </div>
        </div>
      </div>
      <div class="certificate-buttons">
        <ion-popover
          side="top"
          alignment="center"
          :showBackdrop="false"
          trigger="download-icon"
          trigger-action="hover"
        >
          Complete training to download certificate
        </ion-popover>
        <download-icon id="download-icon" class="download-icon-disabled" />
      </div>
    </div>
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
        v-if="isLoadingTrainingCourse"
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
          ref="trainingCoursesAccordion"
        >
          <training-drop-down
            :headers="['Training', 'Progress', 'Actions']"
            :trainingCourseData="trainingCourseData"
          />
        </accordion-item>

        <accordion-item
          label="Subject Certifications"
          sublabel="Complete at least 1 certification quiz in order to begin tutoring students"
          buttonSize="large"
          data-testid="subject-certifications"
          :isInitiallyOpen="
            initiallyOpenAccordion(currentSubject.certifications)
          "
          ref="subjectCertificationsAccordion"
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
          :isInitiallyOpen="
            initiallyOpenAccordion(currentSubject.additionalSubjects)
          "
          ref="additionalSubjectsAccordion"
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
          :isInitiallyOpen="
            initiallyOpenAccordion(currentSubject.computedSubjects)
          "
          id="computed-subjects-accordion"
          data-testid="computed-subjects-accordion"
          ref="computedSubjectsAccordion"
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
import CertificateIcon from '@/assets/certificate_badge_icon.svg'
import DownloadIcon from '@/assets/icons/download_cert_icon.svg'
import Check from '@/assets/check.svg'
import DisabledCertificateIcon from '@/assets/disabled_certificate_icon.svg'
import { IonPopover } from '@ionic/vue'
import NetworkService from '@/services/NetworkService'
import ModalService from '@/services/ModalService'
import { dayjs } from '@/utils/time-utils'
import { isTrainingComplete } from '@/utils/get-training-progress'
import { UpchieveTrainingCourseKeyEnum } from '@/views/TrainingCourseView/types'

export default {
  name: 'Training',
  components: {
    AccordionItem,
    TrainingDropDown,
    SubjectCertsDropDown,
    AdditionalSubjectsDropDown,
    Loader,
    CertificateIcon,
    DownloadIcon,
    Check,
    DisabledCertificateIcon,
    IonPopover,
  },
  data() {
    return {
      currentTopic: '',
      trainingCourseData: null,
      fetchingTrainingError: false,
      isLoadingTrainingCourse: true,
    }
  },

  async created() {
    if (Object.entries(this.training).length === 0)
      await this.$store.dispatch('subjects/getTrainingSubjects')
    else this.setInitialTopic()
  },

  async beforeMount() {
    try {
      this.isLoadingTrainingCourse = true
      await this.getTrainingCourseData()
    } catch {
      this.fetchingTrainingError = true
    } finally {
      this.isLoadingTrainingCourse = false
    }
  },
  computed: {
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      training: 'subjects/activeTraining',
      hasCompletedVolunteerTraining: 'user/hasCompletedVolunteerTraining',
      hasASubjectCertification: 'user/hasASubjectCertification',
    }),
    ...mapState({
      user: (state) => state.user.user,
      isFetchingTraining: (state) => state.subjects.isFetchingTraining,
    }),
    currentSectionRef() {
      if (this.openToSubject && this.currentSubject) {
        if (
          this.currentSubject.certifications?.some(
            (cert) => cert.key === this.openToSubject
          )
        ) {
          return this.$refs.subjectCertificationsAccordion
        } else if (
          this.currentSubject.additionalSubjects?.some(
            (cert) => cert.key === this.openToSubject
          )
        ) {
          return this.$refs.additionalSubjectsAccordion
        } else if (
          this.currentSubject.computedSubjects?.some(
            (cert) => cert.key === this.openToSubject
          )
        ) {
          return this.$refs.computedSubjectsAccordion
        }
      }
      return undefined
    },
    currentSubject() {
      return this.training[this.currentTopic]
    },
    // get the amount of required training material a user must complete
    requiredTrainingMessage() {
      return !this.hasCompletedVolunteerTraining ? '1 course required' : ''
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
    canDownloadCertificate() {
      return this.hasCompletedVolunteerTraining && this.hasASubjectCertification
    },
    openToSubject() {
      return this.$route.query?.openTo
    },
  },
  methods: {
    async getTrainingCourseData() {
      const trainingCourseResponse = await NetworkService.getTrainingCourse(
        UpchieveTrainingCourseKeyEnum.CURRENT
      )
      this.trainingCourseData = {
        ...trainingCourseResponse.data.course,
        isComplete: isTrainingComplete(),
      }
    },
    initiallyOpenAccordion(certifications) {
      return (
        this.openToSubject &&
        certifications.some((cert) => cert.key === this.openToSubject)
      )
    },
    showTopicTraining(topic) {
      this.currentTopic = topic
    },
    setInitialTopic() {
      this.currentTopic = this.subjectTypes[0].key
    },
    downloadCertificate() {
      const volunteerName = `${this.user.firstName} ${this.user.lastName}`
      const earnedCerts = Object.entries(this.user.certifications).filter(
        ([name]) => {
          return [
            'coachingStrategies',
            'academicIntegrity',
            'dei',
            'communitySafety',
            UpchieveTrainingCourseKeyEnum.LEGACY,
          ].includes(name)
        }
      )
      earnedCerts.sort((certA, certB) => {
        return certA.lastAttemptedAt < certB.lastAttemptedAt
      })
      const effectiveDate = dayjs(earnedCerts[0].lastAttemptedAt).format(
        'MM/DD/YYYY'
      )
      const canvas = document.createElement('canvas')
      canvas.width = 2892
      canvas.height = 1623
      const ctx = canvas.getContext('2d')

      const certificateImg = new Image()
      certificateImg.src = '/blank_tutor_certificate.png'

      certificateImg.onload = () => {
        ctx.drawImage(certificateImg, 0, 0, canvas.width, canvas.height)

        ctx.font = "80px 'Brush Script MT', cursive"
        ctx.fillStyle = '#000'
        ctx.textAlign = 'center'
        ctx.fillText(volunteerName, canvas.width / 2, 850)

        ctx.font = "40px 'Times New Roman', serif"
        ctx.fillText(effectiveDate, canvas.width / 2 - 840, 1275)

        const link = document.createElement('a')
        link.href = canvas.toDataURL('image/png')
        link.download = 'UPchieveTutorCertificate.png'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      certificateImg.onerror = () => {
        void ModalService.showAlert(
          'Error',
          'Could not load certificate background image. Please try again later.'
        )
      }
    },
  },
  watch: {
    'training.subjectTypes': {
      handler(newValue, oldValue) {
        const nowLoaded = newValue && !oldValue
        if (nowLoaded) this.setInitialTopic()
      },
      deep: true,
    },
    currentSubject(newValue, oldValue) {
      /*
      When the current subject loads, we check if there is the `openTo` route query parameter and then
      scroll the correct dropdown into view.
       */
      if (!oldValue && newValue) {
        if (this.openToSubject) {
          this.$nextTick(() => {
            // Refs are available after render
            const ref = this.currentSectionRef
            if (ref) {
              ref?.$el.scrollIntoView({ behavior: 'smooth', block: 'end' })
            }
          })
        }
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.certificate-container {
  @include flex-container(row, space-between, center);
  max-width: 1200px;
  width: 100%;
  border-radius: 7px;
  padding: 20px;
  background: #f2fbf9;
  margin-bottom: 20px;
  gap: 16px;
}

.certificate-container-disabled {
  @include flex-container(row, space-between, center);
  max-width: 1200px;
  width: 100%;
  border-radius: 7px;
  padding: 20px;
  background: #f1f3f6;
  margin-bottom: 20px;
  gap: 16px;
  border: 2px solid #d8dee5;
}

.certificate-icon-and-text {
  @include flex-container(row, center, center);
  gap: 16px;
}

.certificate-header {
  @include flex-container(row, left, center);
  gap: 8px;
}

.certificate-heading {
  font-size: 26px;
}

.certificate-text {
  margin-left: 36px;
}

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
    @include font-category('display-small');
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

ion-popover::part(content) {
  background-color: #323338;
  color: #fff;
  font-size: 14px;
  padding: 8px;
}
</style>
