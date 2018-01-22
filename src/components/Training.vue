<template>
  <div v-if="user.isVolunteer" class="training">
    <h1 class="header">Volunteer Training</h1>
    <div class="body-container">
      <div v-for="supercategory in supercategories">
        <div class="supercategory" v-bind:style="{ backgroundColor: colors[supercategory]}" v-on:click="flipBool(supercategory)" v-if="supercategory != 'esl'">
          {{ supercategory | capitalize }}
          <div class="arrow up" v-if="bools[supercategory]"></div>
          <div class="arrow down" v-if="!bools[supercategory]"></div>
        </div>
        <div class="supercategory" v-bind:style="{ backgroundColor: colors[supercategory]}" v-on:click="flipBool(supercategory)" v-if="supercategory == 'esl'">
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
                <router-link :to="'/training/' + category + '/review'" tag="div" class="review-container">
                  <div class="review-label">Review</div>
                  <div class="arrow right"></div>
                </router-link>
              </div>
            </div>
            <div class="test">
                <router-link :to="'/training/' + category + '/quiz'" tag="div" v-if="!hasPassed(category) && hasTries(category)" class="test-container">
                  <div class="test-label">Take test</div>
                  <div class="arrow right"></div>
                </router-link>
              <div class="test-container certified" v-if="hasPassed(category)">Certified!</div>
              <div class="numTries">You have used {{ getTries(category) }}/3 tries.</div>
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
  data() {
    var user = UserService.getUser();
    var quizzes = new Object();
    quizzes['math'] = ['algebra', 'geometry', 'trigonometry', 'precalculus', 'calculus'];
    quizzes['esl'] = ['esl'];
    var bools = new Object();
    bools['math'] = false;
    bools['esl'] = false;
    var supercategories = ['esl', 'math'];
    var colors = new Object();
    colors['esl'] = '#1855D1';
    colors['math'] = '#F7AEF8';
    return {
      user: user,
      quizzes: quizzes,
      bools: bools,
      supercategories: supercategories,
      colors: colors
    }
  },
  filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    uppercase: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.toUpperCase()
    }
  },
  methods: {
    flipBool(supercategory) {
      var bool = this.bools[supercategory];
      this.bools[supercategory] = !bool;
    },
    hasPassed(category) {
      if (this.user[category]) {
        return this.user[category]['passed'];
      }
      else {
        return false;
      }
    },
    hasTries(category) {
      if (this.user[category]) {
        return (this.user[category]['tries'] < 3);
      }
      else {
        return true;
      }
    },
    getTries(category) {
      if (this.user[category]) {
        return this.user[category].tries;
      }
      else {
        return 0;
      }
    }
  }
}
</script>

<style scoped>

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
