<template>
  <div class="wrapper">
    <h1 class="header-title">{{ category }} Review Materials</h1>
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
</template>

<script>
import NetworkService from "@/services/NetworkService";

export default {
  components: {},
  data() {
    return {
      reviewMaterials: [],
      category: ""
    };
  },
  mounted() {
    const { params } = this.$route;
    const { category } = params;
    this.category = category;
    this.getCategoryMaterials();
    this.getReviewMaterials();
  },
  methods: {
    getCategoryMaterials() {
      const TOPICS_AND_RESOURCES = "Topics & Resources";
      const CONCEPT_REVIEW = "Concept Review";

      switch (this.category) {
        case "algebra":
          this.reviewMaterials = [
            {
              title: CONCEPT_REVIEW,
              pdf: require(`../assets/review_materials/algebra/algebra-concept-review.pdf`),
              image: require(`../assets/review_materials/algebra/algebra-concept-review.png`)
            },
            {
              title: TOPICS_AND_RESOURCES,
              pdf: require(`../assets/review_materials/algebra/algebra-topics-and-resources.pdf`),
              image: require(`../assets/review_materials/algebra/algebra-topics-and-resources.png`)
            }
          ];
          break;
        case "geometry":
          this.reviewMaterials = [
            {
              title: CONCEPT_REVIEW,
              pdf: require(`../assets/review_materials/geometry/geometry-concept-review.pdf`),
              image: require(`../assets/review_materials/geometry/geometry-concept-review.png`)
            },
            {
              title: TOPICS_AND_RESOURCES,
              pdf: require(`../assets/review_materials/geometry/geometry-topics-and-resources.pdf`),
              image: require(`../assets/review_materials/geometry/geometry-topics-and-resources.png`)
            }
          ];
          break;
        case "trigonometry":
          this.reviewMaterials = [
            {
              title: CONCEPT_REVIEW,
              pdf: require(`../assets/review_materials/trigonometry/trigonometry-concept-review.pdf`),
              image: require(`../assets/review_materials/trigonometry/trigonometry-concept-review.png`)
            },
            {
              title: TOPICS_AND_RESOURCES,
              pdf: require(`../assets/review_materials/trigonometry/trigonometry-topics-and-resources.pdf`),
              image: require(`../assets/review_materials/trigonometry/trigonometry-topics-and-resources.png`)
            }
          ];
          break;
        case "precalculus":
          this.reviewMaterials = [
            {
              title: CONCEPT_REVIEW,
              pdf: require(`../assets/review_materials/precalculus/precalculus-concept-review.pdf`),
              image: require(`../assets/review_materials/precalculus/precalculus-concept-review.png`)
            },
            {
              title: TOPICS_AND_RESOURCES,
              pdf: require(`../assets/review_materials/precalculus/precalculus-topics-and-resources.pdf`),
              image: require(`../assets/review_materials/precalculus/precalculus-topics-and-resources.png`)
            }
          ];
          break;
        case "calculus":
          this.reviewMaterials = [
            {
              title: CONCEPT_REVIEW,
              pdf: require(`../assets/review_materials/calculus/calculus-concept-review.pdf`),
              image: require(`../assets/review_materials/calculus/calculus-concept-review.png`)
            },
            {
              title: TOPICS_AND_RESOURCES,
              pdf: require(`../assets/review_materials/calculus/calculus-topics-and-resources.pdf`),
              image: require(`../assets/review_materials/calculus/calculus-topics-and-resources.png`)
            }
          ];
          break;
        case "planning":
          this.reviewMaterials = [
            {
              title: "College Planning",
              pdf: require(`../assets/review_materials/planning/college-planning.pdf`),
              image: require(`../assets/review_materials/planning/college-planning.png`)
            }
          ];
          break;
        case "essays":
          this.reviewMaterials = [
            {
              title: "Essay Editing Guide",
              pdf: require(`../assets/review_materials/essays/essay-editing-guide.pdf`),
              image: require(`../assets/review_materials/essays/essay-editing-guide.png`)
            }
          ];
          break;
        case "applications":
          this.reviewMaterials = [
            {
              title: "Application Help Guide",
              pdf: require(`../assets/review_materials/applications/application-help-guide.pdf`),
              image: require(`../assets/review_materials/applications/application-help-guide.png`)
            }
          ];
          break;
        default:
          break;
      }
    },
    getReviewMaterials() {
      NetworkService.getReviewMaterials(this, this.category);
    }
  }
};
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
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 200px;
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
  height: 140px;
}

@media screen and (max-width: 375px) {
  .review-materials {
    &__link {
      margin-right: 0;
    }

    &__content {
      width: initial;
    }
  }
}
</style>
