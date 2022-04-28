<template>
  <div class="wrapper">
    <div v-if="error">
      <p class="error-message">
        Please click
        <router-link to="/training">
          here
        </router-link>
        to see our available categories and their associated review materials.
      </p>
    </div>
    <div v-else-if="reviewMaterials.length === 0">
      <h1 class="header-title">{{ categoryDisplayName }} Review Materials</h1>
      <p class="error-message">
        Sorry, review materials for {{ categoryDisplayName }} are currently
        under development. Check back soon!
      </p>
    </div>
    <div v-else>
      <h1 class="header-title">{{ categoryDisplayName }} Review Materials</h1>
      <div class="review-materials">
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
            <img :src="review.image" class="review-materials__image" />
            <span class="review-materials__title">{{ review.title }}</span>
          </div>
        </a>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Case from 'case'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import isPhysics from '@/utils/is-physics'
import { PHYSICS_MAPPING, EVENTS } from '@/consts'
import { allSubtopics } from '@/utils/topics'

export default {
  components: {},
  data() {
    return {
      reviewMaterials: [],
      category: '',
      error: false,
      hostPath: `https://cdn.upchieve.org/review-materials`
    }
  },
  mounted() {
    const { params } = this.$route
    const category = Case.camel(params.category)
    this.category = category
    AnalyticsService.captureEvent(EVENTS.REVIEW_MATERIALS_VIEWED, {
      event: EVENTS.REVIEW_MATERIALS_VIEWED,
      subject: this.category
    })

    // format physics from lowercase 'physicsone' -> 'physicsOne'
    if (isPhysics(category)) this.category = PHYSICS_MAPPING[category]

    this.getCategoryMaterials()
    if (!this.error) {
      this.getReviewMaterials()
    }
  },
  methods: {
    getCategoryMaterials() {
      // TODO: remove `algebra` case below in algebra 2 launch cleanup
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
          this.reviewMaterials = [
            {
              title: 'Topics & Resources',
              pdf: this.getTopicsAndResourcePath('pdf'),
              image: this.getTopicsAndResourcePath('png')
            },
            {
              title: 'Concept Review',
              pdf: this.getConceptReviewPath('pdf'),
              image: this.getConceptReviewPath('png')
            }
          ]
          break
        case 'planning':
          this.reviewMaterials = [
            {
              title: 'College Planning Review',
              pdf: `${this.hostPath}/college-planning-review.pdf`,
              image: `${this.hostPath}/college-planning-review.png`
            }
          ]
          break
        case 'essays':
          this.reviewMaterials = [
            {
              title: 'College Essays Review',
              pdf: `${this.hostPath}/college-essays-review.pdf`,
              image: `${this.hostPath}/college-essays-review.png`
            }
          ]
          break
        case 'applications':
          this.reviewMaterials = [
            {
              title: 'College Applications Review',
              pdf: `${this.hostPath}/college-applications-review.pdf`,
              image: `${this.hostPath}/college-applications-review.png`
            }
          ]
          break
        case 'satReading':
          this.reviewMaterials = [
            {
              title: 'SAT Reading Review Guide',
              pdf: `${this.hostPath}/sat-reading-review-guide.pdf`,
              image: `${this.hostPath}/sat-reading-review-guide.png`
            }
          ]
          break
        case 'satMath':
          this.reviewMaterials = [
            {
              title: 'SAT Math Review Guide',
              pdf: `${this.hostPath}/sat-math-review-guide.pdf`,
              image: `${this.hostPath}/sat-math-review-guide.png`
            }
          ]
          break
        case 'environmentalScience':
          this.reviewMaterials = []
          break
        case 'humanitiesEssays':
          this.reviewMaterials = [
            {
              title: 'Humanities Essays Review Guide',
              pdf: `${this.hostPath}/humanities-essays-review-guide.pdf`,
              image: `${this.hostPath}/humanities-essays-review-guide.png`
            }
          ]
          break
        case 'reading':
          this.reviewMaterials = [
            {
              title: 'Reading Review Guide',
              pdf: `${this.hostPath}/reading-review.pdf`,
              image: `${this.hostPath}/reading-review.png`
            }
          ]
          break
        // case for a user entering a subject that we do not support
        default:
          this.error = true
          break
      }
    },
    getReviewMaterials() {
      // Receives no content - used for tracking user actions
      NetworkService.getReviewMaterials(this, this.category)
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
    }
  },
  computed: {
    ...mapGetters({
      isAlgebraTwoLaunchActive: 'featureFlags/isAlgebraTwoLaunchActive'
    }),
    categoryDisplayName() {
      const subtopics = allSubtopics()
      // TODO: remove condition below in algebra 2 launch cleanup
      if (!this.isAlgebraTwoLaunchActive && this.category === 'algebra') 
        return 'Algebra'
      if (this.category) return subtopics[this.category].displayName

      return ''
    }
  }
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

@media screen and (max-width: 760px) {
  .review-materials {
    &__link {
      width: 100%;
      margin-right: 0;
    }
  }
}
</style>
