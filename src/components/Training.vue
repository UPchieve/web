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
        <router-link to="/training/algebra/quiz" tag="div">Take test</router-link>
      </div>
      <div class="geometry subcategory" v-show="mathExpand">
        <div>
          <span>Geometry</span>
          <div class="review">
            <router-link to="/training/geometry/review" tag="div">Review</router-link>
          </div>
        </div>
        <router-link to="/training/geometry/quiz" tag="div">Take test</router-link>
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

</style>
