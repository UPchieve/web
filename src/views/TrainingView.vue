<template>
  <div v-if="user.isVolunteer" class="training">
    <div class="body-container">
      <h1 class="body-header">Volunteer Training</h1>
      <div v-for="supercategory in supercategories" :key="supercategory">
        <div
          v-if="supercategory !== 'esl'"
          :style="{ backgroundColor: colors[supercategory] }"
          class="supercategory"
          @click="flipBool(supercategory)"
        >
          {{ supercategory | capitalize }}
          <div v-if="bools[supercategory]" class="arrow up" />
          <div v-if="!bools[supercategory]" class="arrow down" />
        </div>
        <div
          v-if="supercategory === 'esl'"
          :style="{ backgroundColor: colors[supercategory] }"
          class="supercategory"
          @click="flipBool(supercategory)"
        >
          {{ supercategory | uppercase }}
          <div v-if="bools[supercategory]" class="arrow up" />
          <div v-if="!bools[supercategory]" class="arrow down" />
        </div>
        <div v-for="category in quizzes[supercategory]" :key="category">
          <div v-show="bools[supercategory]" class="category">
            <div>
              <span v-if="category !== 'esl'">{{ category | capitalize }}</span>
              <span v-if="category === 'esl'">{{ category | uppercase }}</span>
              <div class="review">
                <div class="review-container">
                  <div class="review-label">
                    <a :href="reviewMaterials[category]" target="_blank"
                      >Review</a
                    >
                  </div>
                  <div class="arrow right" />
                </div>
              </div>
            </div>
            <div class="test">
              <router-link
                v-if="!hasPassed(category) && hasTries(category)"
                :to="'/training/' + category + '/quiz'"
                tag="div"
                class="test-container"
              >
                <div class="test-label">Take test</div>
                <div class="arrow right" />
              </router-link>
              <div v-if="hasPassed(category)" class="test-container certified">
                Certified!
              </div>
              <div class="numTries">
                You have used {{ getTries(category) }}/3 tries.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

/**
 * @todo {1} Refactor into global filters (https://vuejs.org/v2/guide/filters.html)
 */
export default {
  filters: {
    // {1}
    capitalize(value) {
      if (!value) return "";
      const valueStr = value.toString();
      return valueStr.charAt(0).toUpperCase() + valueStr.slice(1);
    },
    uppercase(value) {
      if (!value) return "";
      return value.toString().toUpperCase();
    }
  },
  data() {
    const quizzes = {};
    quizzes.math = [
      "algebra",
      "geometry",
      "trigonometry",
      "precalculus",
      "calculus"
    ];
    quizzes.esl = ["esl"];
    quizzes["college Counseling"] = ["planning", "essays", "applications"];
    // quizzes['science'] = ['biology', 'chemistry'];
    const bools = {};
    bools.math = false;
    bools.esl = false;
    bools["college Counseling"] = false;
    bools.science = false;
    // Science Currently Removed due to quiz issues -Will
    // var supercategories = ['esl', 'math', 'college Counseling', 'science'];
    const supercategories = ["esl", "math", "college Counseling"];
    const colors = {};
    colors.esl = "#1855D1";
    colors.math = "#F7AEF8";
    colors["college Counseling"] = "#FED766";
    colors.science = "#9575CD";
    const reviewMaterials = {};
    reviewMaterials.algebra =
      "https://drive.google.com/open?id=105iP5lJdVti-r2reY8N3tKQOA0FtrjZW";
    reviewMaterials.geometry =
      "https://drive.google.com/open?id=1Ug_JbG8_Rok60B__o0E4WQ426WV9VmJe";
    reviewMaterials.trigonometry =
      "https://drive.google.com/open?id=1cQ_JcY9IS29t4k8IaZHHJYKwV0FhkbX3";
    reviewMaterials.precalculus =
      "https://drive.google.com/open?id=1jOGiQNs_IWwh3cT2mW-1kj9I80NeotaT";
    reviewMaterials.calculus =
      "https://drive.google.com/open?id=1BePatfy99En5KwLEDVP2XTMdeMR0NEMx";
    reviewMaterials.esl =
      "https://drive.google.com/open?id=1P99PIY89X6VdvCGMMzjNOS55Nvljkc8Lv6FxmjJzo8Y";
    reviewMaterials.planning =
      "https://drive.google.com/open?id=1b_EHOgtrkkyWa6ge4fbKqxC7ZDgHrJxx";
    reviewMaterials.essays =
      "https://drive.google.com/open?id=1lJXVI1f9Do60pNXcBQGSZThNXhYmtMvV";
    reviewMaterials.applications =
      "https://drive.google.com/open?id=1gXmbGRaUz324-EiZMzph1KUYS8WhR9ax";
    return {
      quizzes,
      bools,
      supercategories,
      colors,
      reviewMaterials
    };
  },
  computed: {
    ...mapState({ user: state => state.user.user })
  },
  methods: {
    flipBool(supercategory) {
      const bool = this.bools[supercategory];
      this.bools[supercategory] = !bool;
    },
    hasPassed(category) {
      if (this.user[category]) {
        return this.user[category].passed;
      }

      return false;
    },
    hasTries(category) {
      if (this.user[category]) {
        return this.user[category].tries < 3;
      }

      return true;
    },
    getTries(category) {
      if (this.user[category]) {
        return this.user[category].tries;
      }

      return 0;
    }
  }
};
</script>

<style lang="scss" scoped>
.body-container {
  max-width: 800px;
  border-radius: 8px;
  background: #fff;
  padding: 40px 15px 80px;

  @include breakpoint-above("medium") {
    padding: 40px 40px 80px;
  }

  .body-header {
    font-size: 24px;
    font-weight: 500;
    text-align: left;
    margin: 0 0 35px 0;
  }
}

.training {
  padding: 10px;

  @include breakpoint-above("medium") {
    padding: 40px;
  }
}

a {
  color: inherit;
  text-decoration: none;
}

.supercategory,
.category {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 450px;
  height: 60px;
}

.supercategory,
.header {
  text-align: start;
  font-size: 24px;
}

.supercategory {
  color: #fff;
  margin-top: 20px;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  text-shadow: 0px 0px 2px #00000027;
  padding: 0px 17px 0 20px;
}

.category {
  font-size: 16px;
  border: 1px solid #eeeeee;
  text-align: left;
  padding: 0px 20px;
}

.category span {
  font-weight: 600;
}

.review {
  font-size: 12px;
  text-align: start;
}

.test {
  display: flex;
  flex-direction: column;
  min-width: 143px;
}

.test-container,
.review-container {
  display: flex;
  align-items: center;
}

.test-container {
  cursor: default;
}

.test-container:not(.certified) {
  cursor: pointer;
}

.test-container:not(.certified):hover {
  color: #5a5a5f;
}

.test-container .arrow.right {
  padding-left: 3px;
  transition: padding-left 0.1s ease-in;
}

.test-container:hover .arrow.right {
  padding-left: 6px;
}

.test-container .arrow.right::after {
  background-size: 38%;
}

.numTries {
  font-size: 12px;
}

.arrow {
  height: 1em;
  width: 1em;
  position: relative;
}

.arrow::after {
  content: "";
  z-index: 2;
  width: 100%;
  height: 100%;
  position: absolute;
  background-repeat: no-repeat;
  background-position: center;
}

.review-container .arrow.right {
  height: 1.3em;
  width: 1.3em;
}

.review-container .arrow.right::after {
  background-size: 24%;
}

.arrow.down::after {
  background-image: url("~@/assets/down_arrow.png");
}

.arrow.up::after {
  background-image: url("~@/assets/up_arrow.png");
}

.arrow.right::after {
  background-image: url("~@/assets/right_arrow.png");
}

.certified {
  color: #16d2aa;
  font-weight: 600;
}

@media screen and (max-width: 700px) {
  .supercategory,
  .category {
    width: auto !important;
  }
}
</style>
