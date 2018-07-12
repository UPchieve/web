<template>
  <div v-if="user.isVolunteer" class="training">
    <h1 class="header">Volunteer Training</h1>
    <div class="body-container">
      <div v-for="supercategory in supercategories">

        <div 
          class="supercategory" 
          :style="{ backgroundColor: colors[supercategory]}" 
          v-on:click="flipBool(supercategory)" 
          v-if="supercategory != 'esl'"
         >
          {{ supercategory | capitalize }}
          <div class="arrow up" v-if="bools[supercategory]"></div>
          <div class="arrow down" v-if="!bools[supercategory]"></div>
        </div>
        <div 
          class="supercategory" 
          :style="{ backgroundColor: colors[supercategory]}" 
          v-on:click="flipBool(supercategory)" 
          v-if="supercategory == 'esl'"
        >
          {{ supercategory | uppercase }}
          <div class="arrow up" v-if="bools[supercategory]"></div>
          <div class="arrow down" v-if="!bools[supercategory]"></div>
        </div>

        <div v-for="category in quizzes[supercategory]">
          <div class="category" v-show="bools[supercategory]">
            <div>
              <span v-if="category != 'esl'">{{ category | capitalize }}</span>
              <span v-if="category == 'esl'">{{ category | uppercase }}</span>
              <div class="review">
                <div class="review-container">
                  <div class="review-label">
                    <a :href="reviewMaterials[category]" target="_blank">Review</a>
                  </div>
                  <div class="arrow right"></div>
                </div>
              </div>
            </div>
            <div class="test">
                <router-link 
                  :to="'/training/' + category + '/quiz'" tag="div" 
                  v-if="!user[category]['passed'] && (user[category]['tries'] < 3)" 
                  class="test-container"
                >
                  <div class="test-label">Take test</div>
                  <div class="arrow right"></div>
                </router-link>
              <div class="test-container certified" v-if="user[category]['passed']">Certified!</div>
              <div class="numTries" v-if="!user[category]['passed']">
                You have used {{ user[category]['tries'] }}/3 tries.
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>


<script>
import UserService from 'src/services/UserService';
export default {

  // @notes
  // [1] The full array included 'essay' and 'application', but adding them will
  //     caused an error since it seems that these subtopics haven't been added
  //     to te schema
  // [2] Science Currently Removed due to quiz issues -Will
  //     supercategories = ['esl', 'math', 'college Counseling', 'science']
  //     quizzes['science'] = ['biology', 'chemistry']
  data() {
    return {
      user: {},
      quizzes: {
        'math': ['algebra', 'geometry', 'trigonometry', 'precalculus', 'calculus'],
        'esl': ['esl'],
        'college Counseling': ['planning'] /* [1] */
      },
      bools: {
        'math': false,
        'esl': false,
        'college Counseling': false,
        'science': false
      },
      supercategories: ['esl', 'math', 'college Counseling'], /* [2] */
      colors: {
        'esl': '#1855D1',
        'math': '#F7AEF8',
        'college Counseling': '#FED766',
        'science': '#9575CD'
      },
      reviewMaterials: {
        'algebra': 'https://drive.google.com/open?id=1UQCaewADDlYXT7vv4-GUuTg7rjLnIdeufGwLgezBo4Y',
        'geometry': 'https://docs.google.com/document/d/128AHz0DakobmILSTrbiQVix3677FhCNcazduc3896Lk/edit?usp=sharing',
        'trigonometry': 'https://drive.google.com/open?id=0B8mTVZa3-VGQUkxhd0R0Wmg1azZ5Z1pWUE8xa2g0MGZYemZF',
        'precalculus': 'https://drive.google.com/open?id=1_T6wdW1_aDvT5kkK2DslUTBllRdOAc_JJ4oxHzzoB6U',
        'calculus': 'https://drive.google.com/open?id=1dxBoVIZsmw4tuUkmDF2y1rmuS0tvxw_d',
        'esl': 'https://drive.google.com/open?id=1P99PIY89X6VdvCGMMzjNOS55Nvljkc8Lv6FxmjJzo8Y',
        'planning': 'https://drive.google.com/file/d/1MXl7g4E4hdt05Pt8jl9gQvr1kfv-cKBU/view?usp=sharing',
        'essay': 'https://drive.google.com/file/d/19IyuDkShzdaRvN0fAZqvYkpoMJPR-XfG/view?usp=sharing',
        'application': 'https://drive.google.com/file/d/18J5ca1LSNgh_9MQqct02Myr5UMFp1VOu/view?usp=sharing',
      }
    }
  },

  filters: {
    capitalize: function (value) {
      if (!value) return '';
      value = value.toString();
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
    uppercase: function (value) {
      if (!value) return '';
      value = value.toString();
      return value.toUpperCase();
    }
  },

  methods: {
    flipBool(supercategory) {
      let bool = this.bools[supercategory];
      this.bools[supercategory] = !bool;
    },
  },

  mounted() {
    UserService.fetchUser(this)
      .then((user) => {
        this.user = user;
      })
      .catch((err) => {
        console.warn('Current user data wasn\'t fetched, showing cached data');
        this.user = UserService.getUser();
      });
  }
}
</script>


<style scoped>

a {
  color: inherit;
  text-decoration: none;
}

.training {
  color: #73737A;
}

.supercategory, .category {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 450px;
  height: 60px;
  padding: 0px 20px;
}

.supercategory, .header {
  text-align: start;
  font-size: 24px;
}

.supercategory {
  color: #FFF;
  margin-top: 20px;
  font-size: 20px;
  font-weight: 600;
}

.category {
  font-size: 16px;
  border: 1px solid #EEEEEE;
  text-align: left;
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

.test-container, .review-container {
  display: flex;
  align-items: center;
}

.numTries {
  font-size: 12px;
}

.arrow {
  padding-right: 10px;
  height: 15px;
}

.arrow::after {
  content: "";
  z-index: 2;
  width: 20px;
  height: 15px;
  position: absolute;
  background-repeat: no-repeat;
  background-position: center;
}

.review-container .arrow.right::after {
  background-size: 30%;
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
  border-bottom: 0.5px solid #CCCCCF;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}

.body-container {
  margin-left: 30px;
}

.certified {
  color: #16D2AA;
  font-weight: 600;
}

</style>
