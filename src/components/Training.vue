<template>
  <div v-if="user.isVolunteer" class="training">
    <h1 class="header">Volunteer Training</h1>

    <div class="collegeAdmissions">
      <div class="supercategory">College Admissions</div>
    </div>

    <div class="ESL">
      <div class="supercategory">ESL</div>
    </div>

    <div class="math">
      <div class="supercategory" v-on:click="mathExpand = !mathExpand">Math</div>
      <div v-for="category in quizzes['math']">
        <div class="category" v-show="mathExpand">
          <div>
            <span>{{ category | capitalize }}</span>
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
    quizzes['math'] = ['algebra', 'geometry', 'trigonometry'];
    return {
      user: user,
      mathExpand: false,
      quizzes: quizzes
    }
  },
  filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    }
  },
  methods: {
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
