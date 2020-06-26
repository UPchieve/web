<template>
  <div class="background-info">
    <h1 class="header">Background Information</h1>
    <div class="wrap-container">
      <div class="container-content">
        <div class="uc-form-col">
          <p>I am currently... *</p>
          <p class="description">Select all that apply.</p>
          <div class="uc-form-checkbox">
            <input
              type="checkbox"
              value="A high school student"
              v-model="occupationalStatus"
              id="high-school-student"
            />
            <label for="high-school-student">
              A high school student
            </label>
          </div>

          <div class="uc-form-checkbox">
            <input
              type="checkbox"
              value="An undergraduate student"
              v-model="occupationalStatus"
              id="undergraduate-student"
            />
            <label for="undergraduate-student">
              An undergraduate student
            </label>
          </div>

          <div class="uc-form-checkbox">
            <input
              type="checkbox"
              value="A graduate student"
              v-model="occupationalStatus"
              id="graduate-student"
            />
            <label for="graduate-student">
              A graduate student
            </label>
          </div>

          <div class="uc-form-checkbox">
            <input
              type="checkbox"
              value="Working full-time"
              v-model="occupationalStatus"
              id="full-time"
            />
            <label for="full-time">
              Working full-time
            </label>
          </div>

          <div class="uc-form-checkbox">
            <input
              type="checkbox"
              value="Working part-time"
              v-model="occupationalStatus"
              id="part-time"
            />
            <label for="part-time">
              Working part-time
            </label>
          </div>

          <div class="uc-form-checkbox">
            <input
              type="checkbox"
              value="Unemployed"
              v-model="occupationalStatus"
              id="unemployed"
            />
            <label for="unemployed">Unemployed</label>
          </div>

          <div class="uc-form-checkbox">
            <input
              type="checkbox"
              value="Caregiver"
              v-model="occupationalStatus"
              id="caregiver"
            />
            <label for="caregiver">Caregiver</label>
          </div>

          <div class="uc-form-checkbox">
            <input
              type="checkbox"
              value="Retired"
              v-model="occupationalStatus"
              id="retired"
            />
            <label for="retired">Retired</label>
          </div>
        </div>

        <div class="uc-column">
          <label for="linkedin" class="uc-form-label">
            LinkedIn Profile
          </label>
          <p class="description">
            Please provide us the link to your LinkedIn profile to expedite the
            application process. If you do not have a LinkedIn profile, type in
            upchieve.org.
          </p>
          <input
            type="text"
            pattern=".*linkedin\.com.*\/in\/.*"
            v-model="linkedInUrl"
            placeholder="linkedin.com/in/example"
            class="linkedin-input uc-form-input"
            in="linkedin"
          />
        </div>

        <div class="uc-form-col">
          <fieldset aria-required="true">
            <p class="title">
              I am prepared to help students with the following subjects. *
            </p>

            <p class="description">Select all that apply</p>

            <div class="uc-form-checkbox">
              <input
                type="checkbox"
                value="Lower-level Math (Pre-algebra, Algebra, or Geometry)"
                v-model="topicKnowledge"
                id="lower-level-math"
              />
              <label for="lower-level-math">
                Lower-level Math (Pre-algebra, Algebra, or Geometry)
              </label>
            </div>

            <div class="uc-form-checkbox">
              <input
                type="checkbox"
                value="Higher-level Math (up to and including AP Calculus BC)"
                v-model="topicKnowledge"
                id="high-level-math"
              />
              <label for="high-level-math">
                Higher-level Math (up to and including AP Calculus BC)
              </label>
            </div>

            <div class="uc-form-checkbox">
              <input
                type="checkbox"
                value="Biology (up to and including AP Bio)"
                v-model="topicKnowledge"
                id="biology"
              />
              <label for="biology">
                Biology (up to and including AP Bio)
              </label>
            </div>

            <div class="uc-form-checkbox">
              <input
                type="checkbox"
                value="Chemistry (up to and including AP Chem)"
                v-model="topicKnowledge"
                id="chemistry"
              />
              <label for="chemistry">
                Chemistry (up to and including AP Chem)
              </label>
            </div>

            <div class="uc-form-checkbox">
              <input
                type="checkbox"
                value="Physics (up to and including AP Physics 1)"
                v-model="topicKnowledge"
                id="physics"
              />
              <label for="physics">
                Physics (up to and including AP Physics 1)
              </label>
            </div>

            <div class="uc-form-checkbox">
              <input
                type="checkbox"
                value="College Counseling"
                v-model="topicKnowledge"
                id="college-counseling"
              />
              <label for="college-counseling">
                College Counseling
              </label>
            </div>

            <div class="uc-form-checkbox">
              <input
                type="checkbox"
                value="Standardized Testing (SAT Math or Reading)"
                v-model="topicKnowledge"
                id="standardized-testing"
              />
              <label for="standardized-testing">
                Standardized Testing (SAT Math or Reading)
              </label>
            </div>
          </fieldset>
        </div>

        <div class="uc-form-col">
          <label class="uc-form-label">
            Please write 1-2 sentences about any relevant prior experience you
            may have.

            <span class="required" aria-hidden="true">*</span>
          </label>

          <div class="description">
            Sample questions: For high school students: Which courses have you
            taken and what grades did you receive? For college students: What's
            your major and which courses have you taken? (For undergrads, AP
            courses are still relevant!) For those out of school: Do you work in
            a relevant field? Do you have prior tutoring or mentoring
            experience?
          </div>
          <textarea
            class="uc-form-input"
            aria-required="true"
            v-model="experience"
          ></textarea>
        </div>

        <div class="uc-form-col">
          <label class="uc-form-label">
            How did you find out about us?
            <span class="required" aria-hidden="true">*</span>
          </label>

          <select
            aria-required="true"
            v-model="heardFrom"
            class="uc-form-select"
          >
            <option value="School">School</option>

            <option value="Work">Work</option>

            <option value="Teacher">Teacher</option>

            <option value="Co-worker">Co-worker</option>

            <option value="Friend">Friend</option>

            <option value="Social media">Social media</option>

            <option value="Other">Other</option>
          </select>
        </div>

        <button @click="submit" class="uc-form-button">Submit</button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "background-info-view",
  data() {
    return {
      errors: [],
      invalidInputs: [],
      saveFailed: false,
      occupationalStatus: [],
      linkedInUrl: "",
      topicKnowledge: [],
      experience: "",
      heardFrom: ""
    };
  },
  // @todo: favorite academic subject and college
  computed: {
    ...mapState({
      user: state => state.user.user
    })
  },
  methods: {
    submit() {
      console.log(this.occupationalStatus);
      console.log(this.topicKnowledge);
      console.log(this.experience);
      console.log(this.heardFrom);
    }
  }
};
</script>

<style lang="scss" scoped>
.uc-form-checkbox {
  margin-bottom: 0.6em;

  & label {
    @include font-category("body");
  }
}

.uc-form-col {
  margin: 4em 0;
}

textarea {
  width: 100%;
  height: 80px;
}

.background-info {
  @include font-category("body");
}

.wrap-container {
  max-width: 70%;
  padding: 15px 15px 55px 15px;
  @include flex-container(column);
  align-items: stretch;

  @include child-spacing(top, 16px);
  @include child-spacing(right, 0);

  @include breakpoint-above("large") {
    padding: 40px;

    @include child-spacing(top, 0);
    @include child-spacing(right, 40px);

    @include flex-container(row);
  }
}

.header {
  display: flex;
  margin: 0;
  align-items: center;
  justify-content: space-between;
  font-weight: 500;
  padding: 25px 15px 10px 35px;
  @include font-category("display-small");

  @include breakpoint-above("large") {
    padding: 40px 40px 0 40px;
  }
}

.container-content {
  background-color: #fff;
  border-radius: 8px;
  padding: 20px;
  text-align: left;

  @include breakpoint-above("large") {
    padding: 40px;
  }
}

.description {
  margin-top: 10px;
  @include font-category("helper-text");
}
</style>
