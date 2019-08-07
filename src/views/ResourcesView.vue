<template>
  <div class="resources-page">
    <div v-if="!user.isVolunteer">
      <div class="header">
        Resources for Students
      </div>
      <div class="body">
        <div class="description">
          Below are some sites that we think every student should be familiar
          with.
        </div>
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
              <a
                href="https://www.commonapp.org/files/CommonAppRequirementsTracker.pdf"
                target="_blank"
                >Application Requirements & Deadline Tracker</a
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
            <li>
              <a
                href="http://math.stackexchange.com/questions/tagged/calculus "
                target="_blank"
                >Calculus Forum</a
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div v-if="user.isVolunteer">
      <div class="header">
        Resources for Volunteers
      </div>
      <div class="body">
        <div class="description">
          Below are some links that you may need during your shift.
        </div>
        <div class="category">
          <ul class="cat-content">
            <li>
              <a
                href="https://drive.google.com/drive/folders/0B0I0kE7XX47FdG9oMXZQQWVhS2M?usp=sharing"
                target="_blank"
                >Student Uploaded Files</a
              >
            </li>
            <li>
              <a href="https://goo.gl/CfPZ2j" target="_blank"
                >Most up to date volunteer schedule</a
              >
            </li>
            <li>
              <a href="https://goo.gl/forms/RGwYN9nu6UbRVF713" target="_blank"
                >Google Form to request schedule change</a
              >
            </li>
            <li>
              <a
                href="https://eliademy.com/app/a/courses/9296633213 "
                target="_blank"
                >Math Tutor course on Eliademy</a
              >
            </li>
            <li>
              <a
                href="https://eliademy.com/app/a/courses/01af786cd6 "
                target="_blank"
                >Admissions Consultant course on Eliademy</a
              >
            </li>
            <li>
              <a href="https://goo.gl/XfdE3X" target="_blank"
                >Resources for Admissions Consultants</a
              >
            </li>
          </ul>
        </div>
      </div>
    </div>
    <div class="end-msg">
      Have ideas for additional resources to add to this page? Email
      <a>info@upchieve.org!</a>
    </div>
  </div>
</template>

<script>
import UserService from "@/services/UserService";

export default {
  data() {
    return {
      user: UserService.getUser()
    };
  }
};
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  padding: 30px;
  margin: 0;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}

.body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  font-size: 16px;
  padding: 30px 30px 20px 30px;
}

.description {
  padding-bottom: 20px;
  font-size: 20px;
}

.category {
  padding-bottom: 10px;
}

.cat-header {
  text-align: left;
  font-size: 20px;
  font-weight: 600;
  padding-bottom: 10px;
}

ul {
  text-align: left;
}

li {
  padding-bottom: 10px;
}

.end-msg {
  font-size: 16px;
  padding: 0 30px 50px;
  text-align: left;
}

@media screen and (max-width: 700px) {
  .header {
    font-size: 24px;
    line-height: 1.2 !important;
    padding: 1em 1em 1em 3em !important;
  }
}
</style>
