<template>
  <div v-if="user.isVolunteer" class="training">
    <div class="body-container">
      <div class="body-header">Volunteer Training</div>
      <div v-for="supercategory in supercategories" :key="supercategory">
        <div
          class="supercategory"
          :style="{ backgroundColor: colorFor(supercategory) }"
          @click="toggleSupercategoryShown(supercategory)"
        >
          {{ supercategory }}
          <div
            v-if="supercategoryMenuDisplayStates[supercategory]"
            class="arrow up"
          />
          <div
            v-if="!supercategoryMenuDisplayStates[supercategory]"
            class="arrow down"
          />
        </div>
        <div v-for="category in quizzes[supercategory]" :key="category">
          <div
            v-show="supercategoryMenuDisplayStates[supercategory]"
            class="category"
          >
            <div class="category-label">
              <span>
                {{ category }}
              </span>
              <div class="review">
                <div class="review-container">
                  <div class="review-label">
                    <router-link
                      :to="'/training/review/' + categoryKeys[category]"
                      tag="a"
                    >
                      Review
                    </router-link>
                  </div>
                  <div class="arrow right" />
                </div>
              </div>
            </div>
            <div class="test">
              <router-link
                v-if="!hasPassed(category) && hasTries(category)"
                :to="'/training/' + categoryKeys[category] + '/quiz'"
                tag="div"
                class="test-container"
              >
                <div class="test-label">Take test</div>
                <div class="arrow right" />
              </router-link>
              <div v-if="hasPassed(category)" class="test-container certified">
                Certified!
              </div>
              <div v-if="!hasPassed(category)" class="numTries">
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
import _ from "lodash";
import { mapState } from "vuex";

import { topics, allSubtopics } from "@/utils/topics";

export default {
  data() {
    // array destructuring syntax [, value] ignores the first entry, in this
    // case the key
    const quizzes = Object.entries(topics)
      .map(([, topicObj]) => [
        topicObj.displayName,
        Object.entries(topicObj.subtopics).map(
          ([, subtopicObj]) => subtopicObj.displayName
        )
      ])
      .reduce((result, [key, value]) => {
        result[key] = value;
        return result;
      }, {});

    // todo consider refactoring so that we identify categories by the
    // key rather than by the display name
    const categoryKeys = Object.entries(allSubtopics())
      .map(([key, subtopicObj]) => [subtopicObj.displayName, key])
      .reduce((result, [displayName, key]) => {
        result[displayName] = key;
        return result;
      }, {});

    const supercategoryColors = {
      "Math Tutoring": "#ef9bf9",
      "College Counseling": "#f3c639",
      default: "#1855D1"
    };

    return {
      quizzes,
      supercategoryColors,
      categoryKeys,
      supercategoryMenuDisplayStates: {}
    };
  },

  created() {
    const displayStates = Object.entries(this.topicsToDisplay)
      .map(([, topicObj]) => topicObj.displayName)
      .reduce((result, key) => {
        result[key] = false;
        return result;
      }, {});

    // If there's only 1 supercategory, open the collapsible by default
    if (_.size(displayStates) === 1) {
      const singleSupercategoryKey = Object.keys(displayStates)[0];
      displayStates[singleSupercategoryKey] = true;
    }

    this.supercategoryMenuDisplayStates = displayStates;
  },

  computed: {
    ...mapState({ user: state => state.user.user }),

    topicsToDisplay() {
      // Only display math topics to certain flagged volunteers
      return this.user.mathCoachingOnly ? _.pick(topics, "math") : topics;
    },

    supercategories() {
      return Object.entries(this.topicsToDisplay).map(
        ([, topicObj]) => topicObj.displayName
      );
    }
  },

  methods: {
    toggleSupercategoryShown(supercategory) {
      const isShown = this.supercategoryMenuDisplayStates[supercategory];
      this.supercategoryMenuDisplayStates[supercategory] = !isShown;
    },
    hasPassed(category) {
      if (this.user.certifications[this.categoryKeys[category]]) {
        return this.user.certifications[this.categoryKeys[category]].passed;
      }

      return false;
    },
    hasTries(category) {
      if (this.user.certifications[this.categoryKeys[category]]) {
        return this.user.certifications[this.categoryKeys[category]].tries < 3;
      }

      return true;
    },
    getTries(category) {
      if (this.user.certifications[this.categoryKeys[category]]) {
        return this.user.certifications[this.categoryKeys[category]].tries;
      }

      return 0;
    },
    colorFor(supercategory) {
      return (
        this.supercategoryColors[supercategory] ||
        this.supercategoryColors.default
      );
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
  cursor: pointer;
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
  display: inline-block;
}

.category-label {
  width: 55%;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  .test {
    min-width: initial;
  }
}

@media screen and (max-width: 375px) {
  .category-label {
    width: 70%;
  }
}
</style>
