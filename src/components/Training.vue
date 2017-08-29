<template>
  <div v-if="user.isVolunteer" class="training">
    <h1 class="header">Volunteer Training</h1>

    <div class="collegeAdmissions">
      <div class="category">College Admissions</div>
    </div>

    <div class="ESL">
      <div class="category">ESL</div>
    </div>

    <div class="math">
      <div class="category" v-on:click="mathExpand = !mathExpand">Math</div>
      <div class="algebra subcategory" v-show="mathExpand">
        <div>
          <span>Algebra</span>
          <div class="review">
            <router-link to="/training/algebra/review" tag="div">Review</router-link>
          </div>
        </div>
        <div class="test">
          <router-link to="/training/algebra/quiz" tag="div" v-if="!hasPassed('algebra') && hasTries('algebra')">Take test</router-link>
          <div v-if="hasPassed('algebra')">Passed!</div>
          <div class="numTries">You have used {{ getTries('algebra') }}/3 tries.</div>
        </div>
      </div>
      <div class="geometry subcategory" v-show="mathExpand">
        <div>
          <span>Geometry</span>
          <div class="review">
            <router-link to="/training/geometry/review" tag="div">Review</router-link>
          </div>
        </div>
        <div class="test">
          <router-link to="/training/geometry/quiz" tag="div" v-if="!hasPassed('geometry') && hasTries('geometry')">Take test</router-link>
          <div v-if="hasPassed('geometry')">Passed!</div>
          <div class="numTries">You have used {{ getTries('geometry') }}/3 tries.</div>
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
    return {
      user: user,
      mathExpand: false
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

.category, .subcategory {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 450px;
  height: 60px;
  padding: 0px 20px;
}

.category, .header {
  text-align: start;
  font-size: 24px;
}

.category {
  background: #EEEEEE;
  margin-top: 20px;
}

.subcategory {
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
