<template>
  <div v-if="user.isVolunteer" class="training">
    <h1 class="header">Volunteer Training</h1>
    <div class="body-container">
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
import UserService from 'src/services/UserService'

/**
 * @todo {1} Refactor into global filters (https://vuejs.org/v2/guide/filters.html)
 */
export default {
  filters: {
    // {1}
    capitalize (value) {
      if (!value) return ''
      const valueStr = value.toString()
      return valueStr.charAt(0).toUpperCase() + valueStr.slice(1)
    },
    uppercase (value) {
      if (!value) return ''
      return value.toString().toUpperCase()
    }
  },
  data () {
    const user = UserService.getUser()
    const quizzes = {}
    quizzes.math = [
      'algebra',
      'geometry',
      'trigonometry',
      'precalculus',
      'calculus'
    ]
    quizzes.esl = ['esl']
    quizzes['college Counseling'] = ['planning', 'essays', 'applications']
    // quizzes['science'] = ['biology', 'chemistry'];
    const bools = {}
    bools.math = false
    bools.esl = false
    bools['college Counseling'] = false
    bools.science = false
    // Science Currently Removed due to quiz issues -Will
    // var supercategories = ['esl', 'math', 'college Counseling', 'science'];
    const supercategories = ['esl', 'math', 'college Counseling']
    const colors = {}
    colors.esl = '#1855D1'
    colors.math = '#F7AEF8'
    colors['college Counseling'] = '#FED766'
    colors.science = '#9575CD'
    const reviewMaterials = {}
    reviewMaterials.algebra =
      'https://drive.google.com/open?id=1UQCaewADDlYXT7vv4-GUuTg7rjLnIdeufGwLgezBo4Y'
    reviewMaterials.geometry =
      'https://docs.google.com/document/d/128AHz0DakobmILSTrbiQVix3677FhCNcazduc3896Lk/edit?usp=sharing'
    reviewMaterials.trigonometry =
      'https://drive.google.com/open?id=0B8mTVZa3-VGQUkxhd0R0Wmg1azZ5Z1pWUE8xa2g0MGZYemZF'
    reviewMaterials.precalculus =
      'https://drive.google.com/open?id=1_T6wdW1_aDvT5kkK2DslUTBllRdOAc_JJ4oxHzzoB6U'
    reviewMaterials.calculus =
      'https://drive.google.com/open?id=1dxBoVIZsmw4tuUkmDF2y1rmuS0tvxw_d'
    reviewMaterials.esl =
      'https://drive.google.com/open?id=1P99PIY89X6VdvCGMMzjNOS55Nvljkc8Lv6FxmjJzo8Y'
    reviewMaterials.planning =
      'https://drive.google.com/file/d/1MXl7g4E4hdt05Pt8jl9gQvr1kfv-cKBU/view?usp=sharing'
    reviewMaterials.essay =
      'https://drive.google.com/file/d/19IyuDkShzdaRvN0fAZqvYkpoMJPR-XfG/view?usp=sharing'
    reviewMaterials.application =
      'https://drive.google.com/file/d/18J5ca1LSNgh_9MQqct02Myr5UMFp1VOu/view?usp=sharing'
    return {
      user,
      quizzes,
      bools,
      supercategories,
      colors,
      reviewMaterials
    }
  },
  methods: {
    flipBool (supercategory) {
      const bool = this.bools[supercategory]
      this.bools[supercategory] = !bool
    },
    hasPassed (category) {
      if (this.user[category]) {
        return this.user[category].passed
      }

      return false
    },
    hasTries (category) {
      if (this.user[category]) {
        return this.user[category].tries < 3
      }

      return true
    },
    getTries (category) {
      if (this.user[category]) {
        return this.user[category].tries
      }

      return 0
    }
  }
}
</script>

<style lang="scss" scoped>
a {
  color: inherit;
  text-decoration: none;
}

.training {
  color: #73737a;
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
  position: relative;;
}

.arrow::after {
  content: '';
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
  background-image: url('../assets/down_arrow.png');
}

.arrow.up::after {
  background-image: url('../assets/up_arrow.png');
}

.arrow.right::after {
  background-image: url('../assets/right_arrow.png');
}

.header {
  display: flex;
  padding: 30px;
  margin: 0px;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}

.body-container {
  margin: 0 0 30px 30px;
}

.certified {
  color: #16d2aa;
  font-weight: 600;
}


 @media screen and (max-width: 488px) {
  .header {
    padding: 1em 1em 1em 3em !important;
  }

  .body-container {
    margin: 1.5em !important;
  }

  .supercategory,
  .category {
    width: auto !important;
  }
}
</style>
