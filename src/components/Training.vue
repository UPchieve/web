<template>
  <div v-if="user.isVolunteer" class="training">
    <h1 class="header">Volunteer Training</h1>
    <div v-for="supercategory in supercategories">
      <div class="supercategory" v-on:click="flipBool(supercategory)" v-if="supercategory != 'esl'">{{ supercategory | capitalize }}</div>
      <div class="supercategory" v-on:click="flipBool(supercategory)" v-if="supercategory == 'esl'">{{ supercategory | uppercase }}</div>
      <div v-for="category in quizzes[supercategory]">
        <div class="category" v-show="bools[supercategory]">
          <div>
            <span v-if="category != 'esl'">{{ category | capitalize }}</span>
            <span v-if="category == 'esl'">{{ category | uppercase }}</span>
            <div class="review">
              <router-link :to="'/training/' + category + '/review'" tag="div">Review</router-link>
            </div>
          </div>
          <div class="test">
            <router-link :to="'/training/' + category + '/quiz'" tag="div" v-if="!hasPassed(category) && hasTries(category)">Take test</router-link>
            <div v-if="hasPassed(category)">Passed!</div>
            <div class="numTries">You have used {{ getTries(category) }}/3 tries.</div>
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
    quizzes['math'] = ['algebra', 'geometry', 'trigonometry', 'precalculus'];
    quizzes['esl'] = ['esl'];
    var bools = new Object();
    bools['math'] = false;
    bools['esl'] = false;
    var supercategories = ['esl', 'math'];
    return {
      user: user,
      quizzes: quizzes,
      bools: bools,
      supercategories: supercategories
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
  margin-left: 20px;
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
  background: #EEEEEE;
  margin-top: 20px;
}

.category {
  font-size: 16px;
  border: 1px solid #EEEEEE;
}

.review {
  font-size: 12px;
  text-align: start;
}

.test {
  display: flex;
  flex-direction: column;
}

.numTries {
  font-size: 12px;
}

</style>
