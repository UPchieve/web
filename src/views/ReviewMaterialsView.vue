<template>
  <div class="wrapper">
    <div class="review-materials__container">
      <h1 class="header-title">{{ categoryDisplayName }} Review Materials</h1>
      <loader v-if="isLoadingMaterials" class="loader--center" />
      <div v-else-if="error">
        <p class="error-message">
          Please try refreshing the page or click
          <router-link to="/training">
            here
          </router-link>
          to see our available categories and their associated review materials.
        </p>
      </div>
      <div v-else-if="reviewMaterials.length === 0">
        <p class="error-message">
          Sorry, review materials for {{ categoryDisplayName }} are currently
          under development. Check back soon!
        </p>
      </div>
      <div class="review-materials" v-else>
        <a
          target="_blank"
          rel="noopener noreferrer"
          class="review-materials__link"
          v-for="review in reviewMaterials"
          :href="review.pdf"
          :key="review.title"
        >
          <div class="review-materials__content">
            <div class="image-overlay"></div>
            <img
              :src="review.image"
              class="review-materials__image"
              alt="header image for materials review"
            />
            <span class="review-materials__title">{{ review.title }}</span>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Case from 'case'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { backOff } from 'exponential-backoff'
import Loader from '@/components/Loader'

export default {
  components: { Loader },
  data() {
    return {
      reviewMaterials: [],
      category: '',
      error: false,
      hostPath: `https://cdn.upchieve.org/review-materials`,
      isLoadingMaterials: false,
    }
  },
  mounted() {
    const { params } = this.$route
    const category = Case.camel(params.category)
    this.category = category
    AnalyticsService.captureEvent(EVENTS.REVIEW_MATERIALS_VIEWED, {
      event: EVENTS.REVIEW_MATERIALS_VIEWED,
      subject: this.category,
    })

    this.getCategoryMaterials()
    //TODO: remove below in subjects-database-hydration flag cleanup
    if (!this.error && !this.isSubjectsDatabaseHydrationActive) {
      this.getReviewMaterials()
    }
  },
  methods: {
    async getCategoryMaterials() {
      if (this.isSubjectsDatabaseHydrationActive) {
        try {
          this.isLoadingMaterials = true
          const materials = await backOff(() =>
            NetworkService.getReviewMaterials(this.category)
          )
          this.reviewMaterials = materials.body
        } catch (error) {
          this.error = true
        } finally {
          this.isLoadingMaterials = false
        }
      } else {
        // TODO: remove below in subjects-database-hydration flag cleanup
        switch (this.category) {
          case 'prealgebra':
          case 'algebra':
          case 'algebraOne':
          case 'algebraTwo':
          case 'geometry':
          case 'trigonometry':
          case 'statistics':
          case 'precalculus':
          case 'biology':
          case 'physicsOne':
          case 'physicsTwo':
          case 'calculusAB':
          case 'calculusBC':
          case 'chemistry':
          case 'environmentalScience':
          case 'usHistory':
            this.reviewMaterials = [
              {
                title: 'Topics & Resources',
                pdf: this.getTopicsAndResourcePath('pdf'),
                image: this.getTopicsAndResourcePath('png'),
              },
              {
                title: 'Concept Review',
                pdf: this.getConceptReviewPath('pdf'),
                image: this.getConceptReviewPath('png'),
              },
            ]
            break
          case 'planning':
            this.reviewMaterials = [
              {
                title: 'College Planning Review',
                pdf: `${this.hostPath}/college-planning-review.pdf`,
                image: `${this.hostPath}/college-planning-review.png`,
              },
            ]
            break
          case 'essays':
            this.reviewMaterials = [
              {
                title: 'College Essays Review',
                pdf: `${this.hostPath}/college-essays-review.pdf`,
                image: `${this.hostPath}/college-essays-review.png`,
              },
            ]
            break
          case 'applications':
            this.reviewMaterials = [
              {
                title: 'College Applications Review',
                pdf: `${this.hostPath}/college-applications-review.pdf`,
                image: `${this.hostPath}/college-applications-review.png`,
              },
            ]
            break
          case 'collegePrep':
            this.reviewMaterials = [
              {
                title: 'College Prep Review',
                pdf: `${this.hostPath}/college-prep-review.pdf`,
                image: `${this.hostPath}/college-prep-review.png`,
              },
            ]
            break
          case 'collegeList':
            this.reviewMaterials = [
              {
                title: 'College List Review',
                pdf: `${this.hostPath}/college-list-review.pdf`,
                image: `${this.hostPath}/college-list-review.png`,
              },
            ]
            break
          case 'collegeApps':
            this.reviewMaterials = [
              {
                title: 'College Applications Review',
                pdf: `${this.hostPath}/college-apps-review.pdf`,
                image: `${this.hostPath}/college-apps-review.png`,
              },
            ]
            break
          case 'applicationEssays':
            this.reviewMaterials = [
              {
                title: 'Application Essays Review',
                pdf: `${this.hostPath}/application-essays-review.pdf`,
                image: `${this.hostPath}/application-essays-review.png`,
              },
            ]
            break
          case 'financialAid':
            this.reviewMaterials = [
              {
                title: 'Financial Aid Review',
                pdf: `${this.hostPath}/financial-aid-review.pdf`,
                image: `${this.hostPath}/financial-aid-review.png`,
              },
            ]
            break
          case 'satReading':
            this.reviewMaterials = [
              {
                title: 'SAT Reading Review Guide',
                pdf: `${this.hostPath}/sat-reading-review-guide.pdf`,
                image: `${this.hostPath}/sat-reading-review-guide.png`,
              },
            ]
            break
          case 'satMath':
            this.reviewMaterials = [
              {
                title: 'SAT Math Review Guide',
                pdf: `${this.hostPath}/sat-math-review-guide.pdf`,
                image: `${this.hostPath}/sat-math-review-guide.png`,
              },
            ]
            break
          case 'humanitiesEssays':
            this.reviewMaterials = [
              {
                title: 'Humanities Essays Review Guide',
                pdf: `${this.hostPath}/humanities-essays-review-guide.pdf`,
                image: `${this.hostPath}/humanities-essays-review-guide.png`,
              },
            ]
            break
          case 'reading':
            this.reviewMaterials = [
              {
                title: 'Reading Review Guide',
                pdf: `${this.hostPath}/reading-review.pdf`,
                image: `${this.hostPath}/reading-review.png`,
              },
            ]
            break
          case 'essayPlanning':
            this.reviewMaterials = [
              {
                title: 'Essay Planning Review Guide',
                pdf: `${this.hostPath}/essay-planning-review.pdf`,
                image: `${this.hostPath}/essay-planning-review.png`,
              },
            ]
            break
          case 'essayFeedback':
            this.reviewMaterials = [
              {
                title: 'Essay Feedback Review Guide',
                pdf: `${this.hostPath}/essay-feedback-review.pdf`,
                image: `${this.hostPath}/essay-feedback-review.png`,
              },
            ]
            break
          // case for a user entering a subject that we do not support
          default:
            this.error = true
            break
        }
      }
    },
    getReviewMaterials() {
      // Receives no content - used for tracking user actions
      NetworkService.getReviewMaterials(this.category)
    },
    getConceptReviewPath(ext) {
      return `${
        this.hostPath
      }/${this.category.toLowerCase()}-concept-review.${ext}`
    },
    getTopicsAndResourcePath(ext) {
      return `${
        this.hostPath
      }/${this.category.toLowerCase()}-topics-and-resources.${ext}`
    },
  },
  computed: {
    ...mapState({
      subjects: state => state.subjects.subjects,
    }),
    ...mapGetters({
      allSubtopics: 'subjects/allSubtopics',
      isSubjectsDatabaseHydrationActive:
        'featureFlags/isSubjectsDatabaseHydrationActive',
    }),
    categoryDisplayName() {
      const subtopics = this.isSubjectsDatabaseHydrationActive
        ? this.subjects
        : this.allSubtopics
      if (this.category && subtopics[this.category])
        return subtopics[this.category].displayName

      return ''
    },
  },
}
</script>

<style lang="scss" scoped>
.wrapper {
  padding: 40px 40px 80px;
  margin: 40px 40px 80px;
  background: #fff;
  border-radius: 8px;
  max-width: 800px;
}

.header-title {
  text-transform: capitalize;
  text-align: left;
  font-size: 24px;
  font-weight: 500;
  text-align: left;
  margin: 0 0 35px 0;
}

.review-materials {
  display: flex;
  flex-flow: row wrap;
  padding-left: 0;

  &__container {
    display: flex;
    flex-direction: column;
  }

  &__link {
    margin-right: 2em;
    display: block;
    margin-bottom: 1em;
    width: 40%;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    background-color: white;
    border-radius: 5px;
    border: 1px solid gray;
    position: relative;

    &:hover .image-overlay {
      opacity: 0.6;
    }
  }

  &__title {
    padding: 1em 0;
  }

  &__image {
    width: 100%;
    border-top-left-radius: 5px;
    border-top-right-radius: 5px;
    display: block;
  }
}

.image-overlay {
  width: 100%;
  position: absolute;
  z-index: 5;
  opacity: 0;
  left: 0;
  top: 0;
  height: inherit;
  background-image: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.4) 0%,
    rgba(0, 0, 0, 0) 100%
  );
  height: 160px;
}

.error-message {
  font-size: 16px;
}

.loader--center {
  align-self: center;
}

@media screen and (max-width: 760px) {
  .review-materials {
    &__link {
      width: 100%;
      margin-right: 0;
    }
  }
}
</style>
