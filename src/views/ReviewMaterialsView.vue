<template>
  <div class="wrapper">
    <div class="review-materials__container">
      <h1 class="header-title">{{ categoryDisplayName }} Review Materials</h1>
      <loader v-if="isLoadingMaterials" class="loader--center" />
      <div v-else-if="error">
        <p class="error-message">
          Please try refreshing the page or click
          <router-link to="/training"> here </router-link>
          to see our available categories and their associated review materials.
        </p>
      </div>
      <div v-else-if="reviewMaterials.length === 0">
        <p class="error-message">
          Sorry, review materials for {{ categoryDisplayName }} are currently
          under development. Check back soon!
        </p>
      </div>
      <div v-else>
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
              <img
                :src="review.image"
                class="review-materials__image"
                alt="header image for materials review"
              />
              <span class="review-materials__title">{{ review.title }}</span>
            </div>
          </a>
        </div>

        <large-button
          v-if="
            user.certifications[category] &&
            !user.certifications[category].passed
          "
          primary
          :showArrow="false"
          :routeTo="quizLink"
          class="review-materials__start-quiz"
        >
          <span>Start quiz</span>
        </large-button>
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
import Loader from '@/components/Loader.vue'
import LargeButton from '@/components/LargeButton.vue'

export default {
  components: { Loader, LargeButton },
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
  },
  methods: {
    async getCategoryMaterials() {
      try {
        this.isLoadingMaterials = true
        const materials = await backOff(() =>
          NetworkService.getReviewMaterials(this.category)
        )
        this.reviewMaterials = materials.data
      } catch (error) {
        this.error = true
      } finally {
        this.isLoadingMaterials = false
      }
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
      subjects: (state) => state.subjects.subjects,
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      allSubtopics: 'subjects/allSubtopics',
    }),
    categoryDisplayName() {
      const subtopics = this.subjects
      if (this.category && subtopics[this.category])
        return subtopics[this.category].displayName

      return ''
    },
    quizLink() {
      return `/training/${Case.kebab(this.category)}/quiz`
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

  &__start-quiz {
    margin-top: 2em;
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
