<template>
  <div class="resources-page">
    <div class="header">
      Resources for Students
    </div>
    <div class="description">
      Below are some sites that we think every student should be familiar with.
    </div>
    <div class="body">
      <div class="category">
        <div class="cat-header">College Admissions Resources</div>
        <ul class="cat-content">
          <li>
            <a
              href="https://collegereadiness.collegeboard.org/sat"
              target="_blank"
              >SAT Website</a
            >
          </li>
          <li>
            <a
              href="http://www.act.org/content/act/en/students-and-parents.html"
              target="_blank"
              >ACT Website</a
            >
          </li>
          <li>
            <a
              href="https://collegereadiness.collegeboard.org/sat-subject-tests"
              target="_blank"
              >SAT Subject Tests</a
            >
          </li>
          <li>
            <a
              href="https://bigfuture.collegeboard.org/find-colleges"
              target="_blank"
              >College Search Engine</a
            >
          </li>
          <li>
            <a href="http://www.commonapp.org/" target="_blank"
              >The Common Application Website</a
            >
          </li>
          <li>
            <a href="https://fafsa.ed.gov/" target="_blank"
              >Free Application for Federal Student Aid (FAFSA)</a
            >
          </li>
          <li>
            <a
              href="https://student.collegeboard.org/css-financial-aid-profile"
              target="_blank"
              >CSS/Financial Aid PROFILE</a
            >
          </li>
          <li>
            <a href="https://www.khanacademy.org/sat" target="_blank"
              >SAT Practice Questions</a
            >
          </li>
        </ul>
      </div>
      <div class="category">
        <div class="cat-header">Math Resources</div>
        <ul class="cat-content">
          <li>
            <a href="https://www.khanacademy.org/math/" target="_blank"
              >Khan Academy (math tutorial videos and practice questions)</a
            >
          </li>
          <li>
            <a href="https://www.wolframalpha.com/" target="_blank"
              >Online Calculator (can graph and solve equations)</a
            >
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  computed: {
    ...mapState({ user: state => state.user.user })
  }
};
</script>

<style lang="scss" scoped>
.resources-page {
  border-radius: 8px;
  padding: 40px 20px;
  margin: 40px 20px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @include breakpoint-above("large") {
    margin: 40px;
    padding: 40px;
  }
}

.header {
  color: $c-soft-black;
  font-size: 24px;
  font-weight: 500;
}

.description {
  text-align: left;
  margin: 10px 0 35px;
  color: #77778b;
  font-size: 14px;
}

.body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 16px;
}

.category {
  padding-bottom: 10px;
}

.cat-header {
  text-align: left;
  font-size: 18px;
  font-weight: 500;
  padding-bottom: 10px;
}

ul {
  text-align: left;
}

li {
  padding-bottom: 10px;
}
</style>
