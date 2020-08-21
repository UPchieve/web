<template>
  <div v-if="user.isVolunteer" class="training">
    <div class="body-container">
      <div class="body-header">Volunteer Training and Certifications</div>
      <p class="instructions">
        On this page you can explore the trainings and certifications required
        for each school subject that we offer. Start by selecting a subject
        (Math, Science, etc.) and review both the required training and
        certifications. Once you complete the required training and at least one
        certification per subject, then you'll be able to start tutoring for
        that subject.
      </p>
      <div class="subject-types">
        <p
          v-for="subjectType in subjectTypes"
          :key="subjectType.key"
          @click="showSubjectTraining(subjectType.key)"
          class="subject-types__header-type"
          :class="subjectType.key === currentSubjectType ? 'is-selected' : null"
        >
          {{ subjectType.displayName }}
        </p>
      </div>

      <accordion-item
        label="Training Courses"
        sublabel="Complete the training in order to begin tutoring students"
        buttonSize="large"
        :alertMessage="requiredTrainingMessage"
      >
        <div class="training-cert">
          <template v-if="!isLargeDevice">
            <h3 class="training-cert__header">Training</h3>
            <h3 class="training-cert__header">Progress</h3>
            <h3 class="training-cert__header">Actions</h3>
          </template>

          <template v-for="(cert, index) in getCurrentSubject.training">
            <div
              class="training-cert__cert"
              :key="`training-title-${cert.displayName}-${index}`"
            >
              <check-mark :checked="trainingIsComplete(cert.key)" />
              <div class="training-cert__cert-title">
                <span>{{ cert.displayName }}</span>
                <span
                  class="status-action"
                  :class="{
                    'status-action--progress':
                      courseProgressStatus(cert.key) === 'In progress',
                    'status-action--completed':
                      courseProgressStatus(cert.key) === 'Completed',
                    'status-action--required':
                      courseProgressStatus(cert.key) === 'Required'
                  }"
                  >{{ courseProgressStatus(cert.key) }}</span
                >
              </div>
              <alert-icon
                v-if="!trainingIsComplete(cert.key)"
                class="alert-icon"
              />
            </div>
            <div
              class="training-cert__progress-bar"
              :key="`training-cert__progress-${index}`"
            >
              <div
                class="training-cert__progress-bar--bg"
                :style="{ width: progressBarNumber(cert.key) + '%' }"
              >
                <span
                  class="training-cert__progress-bar--number"
                  :class="{
                    'training-cert__progress-bar--number-center':
                      progressBarNumber(cert.key) < 30
                  }"
                  >{{ progressBarNumber(cert.key) }}%</span
                >
              </div>
            </div>
            <div class="action-buttons" :key="`action-buttons-${index}`">
              <router-link to="/" class="action-buttons__review-link">
                <span class="action-buttons__review-link--text">Review</span>
                <arrow-icon class="action-buttons__review-link--arrow-icon" />
              </router-link>

              <large-button
                primary
                :showArrow="false"
                :routeTo="
                  !trainingIsComplete(cert.key)
                    ? getTrainingCourseLink(cert.key)
                    : null
                "
                class="action-buttons__quiz"
                :disabled="trainingIsComplete(cert.key)"
              >
                <span>{{ showTrainingStatus(cert.key) }}</span>
              </large-button>
            </div>
            <div
              :key="`border-${cert.displayName}-${index}`"
              class="training-cert__row-border"
            />
          </template>
        </div>
      </accordion-item>

      <accordion-item
        label="Subject Certifications"
        sublabel="Complete at least 1 certification quiz in order to begin tutoring students"
        buttonSize="large"
      >
        <div class="training-cert">
          <template v-if="!isLargeDevice">
            <h3 class="training-cert__header">Certification</h3>
            <h3 class="training-cert__header">Included Subjects</h3>
            <h3 class="training-cert__header">Actions</h3>
          </template>

          <template v-for="(cert, index) in getCurrentSubject.certifications">
            <div
              class="training-cert__cert"
              :key="`certification-title-${cert.displayName}-${index}`"
            >
              <check-mark :checked="hasCertCompleted(cert.key)" />
              <div class="training-cert__cert-title">
                <span>{{ cert.displayName }}</span>
                <span
                  class="status-action"
                  :class="{
                    'status-action--progress':
                      certQuizStatus(cert.key) === 'In progress',
                    'status-action--completed':
                      certQuizStatus(cert.key) === 'Completed',
                    'status-action--required':
                      certQuizStatus(cert.key) === 'Required'
                  }"
                  >{{ certQuizStatus(cert.key) }}</span
                >
              </div>
            </div>

            <div
              :key="`certification-subjects-${cert.displayName}-${index}`"
              class="training-cert__certs-included"
            >
              <span
                v-if="isLargeDevice"
                class="training-cert__certs-included--mobile"
                >Included subjects:</span
              >
              <span
                v-for="subject in cert.subjectsIncluded"
                :key="subject.displayName"
                class="training-cert__certs-included--cert"
                :class="{
                  'training-cert__certs-included--cert-completed': hasCertCompleted(
                    subject.key
                  )
                }"
                >{{ subject.displayName }}</span
              >
            </div>

            <div class="action-buttons" :key="`action-buttons-${index}`">
              <router-link to="/" class="action-buttons__review-link">
                <span class="action-buttons__review-link--text">Review</span>
                <arrow-icon class="action-buttons__review-link--arrow-icon" />
              </router-link>

              <large-button
                primary
                :showArrow="false"
                :routeTo="
                  !hasCertCompleted(cert.key) ? getCertQuizLink(cert.key) : null
                "
                class="action-buttons__quiz"
                :disabled="hasCertCompleted(cert.key)"
              >
                <span>{{ certQuizButton(cert.key) }}</span>
              </large-button>
            </div>
            <div
              :key="`border-${cert.displayName}-${index}`"
              class="training-cert__row-border"
            />
          </template>
        </div>
      </accordion-item>

      <accordion-item
        label="Additional Subjects"
        sublabel="Click here to learn more about Integrated Math"
        buttonSize="large"
        v-if="getCurrentSubject.additionalSubjects.length > 0"
      >
        <div class="training-cert">
          <template v-if="!isLargeDevice">
            <h3 class="training-cert__header">Certification</h3>
            <h3 class="training-cert__header">Included Subjects</h3>
            <h3 class="training-cert__header"></h3>
          </template>

          <template
            v-for="(sub, index) in getCurrentSubject.additionalSubjects"
          >
            <div
              class="training-cert__cert"
              :key="`additional-subjects${sub.displayName}-${index}`"
            >
              <check-mark :checked="hasCertCompleted(sub.key)" />
              <div class="training-cert__cert-title">
                <span>{{ sub.displayName }}</span>
                <span class="status-action">Completed</span>
              </div>
            </div>

            <div
              :key="`additional-subjects-${sub.displayName}-${index}`"
              class="training-cert__certs-included"
            >
              <span
                v-if="isLargeDevice"
                class="training-cert__certs-included--mobile"
                >Included subjects:</span
              >
              <span
                v-for="subject in sub.subjectsIncluded"
                :key="subject.key"
                class="training-cert__certs-included--cert"
                :class="{
                  'training-cert__certs-included--cert-completed': hasCertCompleted(
                    subject.key
                  )
                }"
                >{{ subject.displayName }}</span
              >
            </div>
            <div :key="`empty-${index}`" />
            <div
              :key="`border-${sub.displayName}-${index}`"
              class="training-cert__row-border"
            />
          </template>
        </div>
      </accordion-item>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";

import { topics, allSubtopics } from "@/utils/topics";
import isIntegratedMath from "@/utils/is-integrated-math";
import AccordionItem from "@/components/AccordionItem";
import CheckMark from "@/components/CheckMark";
import LargeButton from "@/components/LargeButton";
import ArrowIcon from "@/assets/arrow.svg";
import AlertIcon from "@/assets/alert.svg";

export default {
  name: "Training",
  components: {
    AccordionItem,
    CheckMark,
    LargeButton,
    ArrowIcon,
    AlertIcon
  },
  data() {
    // array destructuring syntax [, value] ignores the first entry, in this
    // case the key
    const quizzes = Object.entries(topics)
      .map(([, topicObj]) => [
        topicObj.displayName,
        Object.entries(topicObj.subtopics).map(
          ([, subtopicObj]) => subtopicObj.displayName
        )
      ])
      .reduce((result, [key, value]) => {
        result[key] = value;
        return result;
      }, {});

    // hide integrated math topics from quiz selection
    const filteredMathQuizzes = quizzes["Math Tutoring"].filter(
      topic => !isIntegratedMath(topic)
    );
    quizzes["Math Tutoring"] = filteredMathQuizzes;

    // todo consider refactoring so that we identify categories by the
    // key rather than by the display name
    const categoryKeys = Object.entries(allSubtopics())
      .map(([key, subtopicObj]) => [subtopicObj.displayName, key])
      .reduce((result, [displayName, key]) => {
        result[displayName] = key;
        return result;
      }, {});

    const supercategoryColors = {
      "Math Tutoring": "#EF9BF9",
      "Science Tutoring": "#9675CE",
      "College Counseling": "#F3C639",
      default: "#1855D1"
    };

    return {
      quizzes,
      supercategoryColors,
      categoryKeys,
      supercategoryMenuDisplayStates: {},
      subjectTypes: [
        { displayName: "Math", key: "math" },
        { displayName: "Science", key: "science" },
        { displayName: "College Counseling", key: "college" }
        // { displayName: "Standardized Testing", key: "sat" }
      ],
      currentSubjectType: "math",
      math: {
        training: [
          { displayName: "UPchieve 101", key: "upchieve101" },
          { displayName: "Tutoring Skills", key: "tutoringSkills" }
        ],
        certifications: [
          {
            displayName: "Pre-algebra",
            subjectsIncluded: [
              { displayName: "Pre-algebra", key: "prealgebra" }
            ],
            key: "prealgebra"
          },
          {
            displayName: "Algebra",
            subjectsIncluded: [
              { displayName: "Pre-algebra", key: "prealgebra" },
              { displayName: "Algebra 1", key: "algebra" },
              { displayName: "Algebra 2", key: "algebra" }
            ],
            key: "algebra"
          },
          {
            displayName: "Geometry",
            subjectsIncluded: [{ displayName: "Geometry", key: "geometry" }],
            key: "geometry"
          },
          {
            displayName: "Trigonometry",
            subjectsIncluded: [
              { displayName: "Trigonometry", key: "trigonometry" }
            ],
            key: "trigonometry"
          },
          // {
          //   displayName: "Statistics",
          //   subjectsIncluded: [{ displayName: "Statistics", key: "statistics" }],
          //   key: "statistics"
          // },
          {
            displayName: "Precalculus",
            subjectsIncluded: [
              { displayName: "Pre-algebra", key: "prealgebra" },
              { displayName: "Algebra 1", key: "algebra" },
              { displayName: "Algebra 2", key: "algebra" },
              { displayName: "Trigonometry", key: "trigonometry" },
              { displayName: "Precalculus", key: "precalculus" }
            ],
            key: "precalculus"
          },
          {
            displayName: "Calculus AB",
            subjectsIncluded: [
              { displayName: "Pre-algebra", key: "prealgebra" },
              { displayName: "Algebra 1", key: "algebra" },
              { displayName: "Algebra 2", key: "algebra" },
              { displayName: "Trigonometry", key: "trigonometry" },
              { displayName: "Precalculus", key: "precalculus" },
              { displayName: "Calculus AB", key: "calculusAB" }
            ],
            key: "calculusAB"
          },
          {
            displayName: "Calculus BC",
            subjectsIncluded: [
              { displayName: "Pre-algebra", key: "prealgebra" },
              { displayName: "Algebra 1", key: "algebra" },
              { displayName: "Algebra 2", key: "algebra" },
              { displayName: "Trigonometry", key: "trigonometry" },
              { displayName: "Precalculus", key: "precalculus" },
              { displayName: "Calculus AB", key: "calculusAB" },
              { displayName: "Calculus BC", key: "calculusBC" }
            ],
            key: "calculusBC"
          }
        ],
        additionalSubjects: [
          {
            displayName: "Integrated Math 1",
            subjectsIncluded: [
              { displayName: "Algebra", key: "algebra" },
              { displayName: "Geometry", key: "geometry" },
              { displayName: "Statistics", key: "statistics" }
            ],
            key: "integratedMathOne"
          },
          {
            displayName: "Integrated Math 2",
            subjectsIncluded: [
              { displayName: "Algebra", key: "algebra" },
              { displayName: "Geometry", key: "geometry" },
              { displayName: "Trigonometry", key: "trigonometry" },
              { displayName: "Statistics", key: "statistics" }
            ],
            key: "integratedMathTwo"
          },
          {
            displayName: "Integrated Math 3",
            subjectsIncluded: [
              { displayName: "Precalculus", key: "precalculus" },
              { displayName: "Statistics", key: "statistics" }
            ],
            key: "integratedMathThree"
          },
          {
            displayName: "Integrated Math 4",
            subjectsIncluded: [
              { displayName: "Precalculus", key: "precalculus" }
            ],

            key: "integratedMathFour"
          }
        ]
      },
      science: {
        training: [
          { displayName: "UPchieve 101", key: "upchieve101" },
          { displayName: "Tutoring Skills", key: "tutoringSkills" }
        ],
        certifications: [
          {
            displayName: "Biology",
            subjectsIncluded: [{ displayName: "Biology", key: "biology" }],
            key: "biology"
          },
          {
            displayName: "Chemistry",
            subjectsIncluded: [{ displayName: "Chemistry", key: "chemistry" }],
            key: "chemistry"
          },
          {
            displayName: "Physics 1",
            subjectsIncluded: [{ displayName: "Physics 1", key: "physicsOne" }],
            key: "physicsOne"
          },
          {
            displayName: "Physics 2",
            subjectsIncluded: [{ displayName: "Physics 2", key: "physicsTwo" }],
            key: "physicsTwo"
          },
          {
            displayName: "Environmental Science",
            subjectsIncluded: [
              {
                displayName: "Environmental Science",
                key: "environmentalScience"
              }
            ],
            key: "environmentalScience"
          }
        ],
        additionalSubjects: []
      },
      college: {
        training: [
          { displayName: "UPchieve 101", key: "upchieve101" }
          // { displayName: "College Counseling", key: "collegeCounseling" }
        ],
        certifications: [
          {
            displayName: "Essays",
            subjectsIncluded: [{ displayName: "Essays", key: "essays" }],
            key: "essays"
          },
          {
            displayName: "Planning",
            subjectsIncluded: [{ displayName: "Planning", key: "planning" }],
            key: "planning"
          },
          {
            displayName: "Applications",
            subjectsIncluded: [
              { displayName: "Applications", key: "applications" }
            ],
            key: "applications"
          }
        ],
        additionalSubjects: [
          // {
          //   displayName: "College Planning",
          //   subjectsIncluded: [
          //     { displayName: "UPchieve 101", key: "upchieve101" },
          //     { displayName: "College Counseling", key: "collegeCounseling" }
          //   ],
          //   key: "planning"
          // },
          // {
          //   displayName: "College Applications",
          //   subjectsIncluded: [
          //     { displayName: "UPchieve 101", key: "upchieve101" },
          //     { displayName: "College Counseling", key: "collegeCounseling" }
          //   ],
          //   key: "applications"
          // }
        ]
      },
      sat: {
        training: [
          { displayName: "UPchieve 101", key: "upchieve101" },
          { displayName: "SAT Strategies ", key: "satStrategies" }
        ],
        certifications: [
          {
            displayName: "SAT Math",
            subjectsIncluded: [{ displayName: "SAT Math", key: "satMath" }],
            key: "satMath"
          },
          {
            displayName: "SAT Reading",
            subjectsIncluded: [
              { displayName: "SAT Reading", key: "satReading" }
            ],
            key: "satReading"
          }
        ],
        additionalSubjects: []
      }
    };
  },

  computed: {
    ...mapGetters({
      mobileMode: "app/mobileMode"
    }),
    ...mapState({
      user: state => state.user.user,
      windowWidth: state => state.app.windowWidth
    }),

    supercategories() {
      return Object.entries(topics).map(([, topicObj]) => topicObj.displayName);
    },
    getCurrentSubject() {
      return this[this.currentSubjectType];
    },
    isLargeDevice() {
      const largeScreenBreakpoint = 992;

      return this.windowWidth <= largeScreenBreakpoint;
    },
    requiredTrainingMessage() {
      let amount = 0;
      for (let subject of this.getCurrentSubject.training) {
        if (!this.user.trainingCourses[subject.key].isComplete) amount++;
      }

      if (!amount) return "";
      if (amount === 1) return `${amount} course required`;
      return `${amount} courses required`;
    }
  },

  methods: {
    toggleSupercategoryShown(supercategory) {
      const isShown = this.supercategoryMenuDisplayStates[supercategory];
      this.supercategoryMenuDisplayStates[supercategory] = !isShown;
    },
    hasPassed(category) {
      if (this.user.certifications[this.categoryKeys[category]]) {
        return this.user.certifications[this.categoryKeys[category]].passed;
      }

      return false;
    },
    showSubjectTraining(subject) {
      this.currentSubjectType = subject;
    },
    getCertQuizLink(cert) {
      return `/training/${cert}/quiz`;
    },
    getCertReviewLink(cert) {
      return `/training/review/${cert}`;
    },
    getTrainingCourseLink(cert) {
      return `/training/course/${cert}`;
    },
    isTrainingComplete(cert) {
      const { isComplete } = this.user.trainingCourses[cert];
      return isComplete;
    },
    showTrainingStatus(cert) {
      const { progress, isComplete } = this.user.trainingCourses[cert];

      if (progress === 0) return "Start course";
      if (isComplete) return "Complete";

      return "Resume course";
    },
    courseProgressStatus(cert) {
      const { progress, isComplete } = this.user.trainingCourses[cert];

      if (progress === 0) return "Not started";
      if (isComplete) return "Completed";

      return "In progress";
    },
    progressBarNumber(cert) {
      const { progress, isComplete } = this.user.trainingCourses[cert];
      // If user has not completed the course quiz show 99%
      if (progress === 100 && !isComplete) return 99;
      else return progress;
    },
    trainingIsComplete(cert) {
      const { isComplete } = this.user.trainingCourses[cert];
      return isComplete;
    },
    certIsComplete(cert) {
      const { passed } = this.user.certifications[cert];
      return passed;
    },
    hasCertCompleted(cert) {
      return this.user.subjects.includes(cert);
    },
    hasSubject(subject) {
      return this.user.subjects.includes(subject);
    },

    certQuizButton(cert) {
      if (this.hasCertCompleted(cert)) return "Complete";
      else return "Start quiz";
    },
    certQuizStatus(cert) {
      if (this.hasCertCompleted(cert)) return "Completed";
      else return "Not started";
    }
  }
};
</script>

<style lang="scss" scoped>
.body-container {
  max-width: 1200px;
  width: 100%;
  border-radius: 8px;
  background: #fff;
  padding: 40px 15px 80px;

  @include breakpoint-above("large") {
    padding: 40px 40px 80px;
  }

  .body-header {
    font-size: 24px;
    font-weight: 500;
    text-align: left;
    margin: 0 0 20px 0;
  }
}

.training {
  padding: 10px;

  @include breakpoint-above("large") {
    padding: 40px;
  }
}

a {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.action-buttons {
  @include flex-container(row, flex-start, center);
  grid-column-start: span 3;

  @include breakpoint-above("large") {
    justify-content: center;
    align-items: center;
    align-self: center;
    justify-self: center;
    grid-column-start: auto;
  }

  &__quiz {
    width: 180px;
  }

  &__review-link {
    @include flex-container(row, flex-start, center);
    color: $c-success-green;
    margin-right: 1.5em;
    align-self: start;

    &--text {
      margin-right: 0.4em;
    }

    &--arrow-icon {
      width: 20px;
      fill: $c-success-green;
    }
    &:hover {
      color: $c-secondary-grey;
    }

    &:hover &--arrow-icon {
      fill: $c-secondary-grey;
    }
  }
}

.certified {
  color: #16d2aa;
  font-weight: 600;
}

.instructions {
  text-align: left;
  font-size: 16px;
  color: $c-secondary-grey;
}

.subject-types {
  @include flex-container(row, space-around, center);

  &__header-type {
    flex-basis: 100%;
    padding-bottom: 0.8em;
    font-size: 16px;

    &:hover {
      cursor: pointer;
    }
  }
}

.is-selected {
  border-bottom: 4px solid $c-success-green;
}

.training-cert {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  grid-row-gap: 2ch;

  @include breakpoint-above("large") {
    grid-template-columns: 0.6fr 1fr 0.8fr;
    overflow-y: scroll;
  }

  @include breakpoint-above("huge") {
    grid-template-columns: 1fr 1fr 1fr;
    overflow-y: auto;
  }

  &__header {
    @include font-category("subheading");
    text-transform: uppercase;
    background-color: $c-backdrop;
    padding: 0.4em;

    &:first-child {
      text-align: left;
      border-top-left-radius: 5px;
      border-bottom-left-radius: 5px;
      padding-left: 3em;
    }

    &:last-child {
      padding-right: 2em;
      border-top-right-radius: 5px;
      border-bottom-right-radius: 5px;
    }
  }

  &__progress-bar {
    width: 100%;
    border: none;
    border-radius: 10rem;
    height: 20px;
    grid-column-start: span 3;
    position: relative;
    background-color: $c-background-grey;

    &--bg {
      width: 100%;
      background-color: $c-success-green;
      height: 100%;
      border-radius: 10rem;
    }

    &--number {
      color: white;
    }

    &--number-center {
      position: absolute;
      left: 0;
      right: 0;
      color: $c-soft-black;
    }

    @include breakpoint-above("small") {
      width: 50%;
    }

    @include breakpoint-above("large") {
      width: 90%;
      align-self: center;
      justify-self: center;
      grid-column-start: auto;
    }

    @include breakpoint-above("huge") {
      width: 70%;
    }
  }

  &__cert {
    @include flex-container(row, flex-start, center);
    align-self: center;
    text-align: left;
    grid-column-start: span 3;

    @include breakpoint-above("large") {
      grid-column-start: auto;
    }
    @include breakpoint-above("large") {
      padding-left: 3em;
    }

    &-title {
      @include flex-container(column, flex-start, flex-start);
      margin-left: 2em;

      @include breakpoint-above("large") {
        width: 100px;
      }
      @include breakpoint-above("huge") {
        min-width: 120px;
      }
    }
  }

  &__row-border {
    grid-column-start: span 3;
    background-color: $c-background-grey;
    height: 2px;

    &:last-child {
      display: none;
    }
  }

  &__certs-included {
    @include flex-container(row, flex-start, center);
    grid-column-start: span 3;
    flex-flow: row wrap;

    @include breakpoint-above("large") {
      @include flex-container(column, center, center);
      height: auto;
      flex-flow: column wrap;
      margin: 0 auto;
      width: 80%;
      grid-column-start: auto;
    }

    @include breakpoint-above("huge") {
      @include flex-container(column, center, center);
      height: 70px;
    }

    &--cert {
      font-size: 12px;
      color: $c-secondary-grey;
      display: inline-block;
      margin-right: 1em;

      &-completed {
        color: $c-soft-black;
      }
    }
    &--mobile {
      display: inline-block;
      margin-right: 1em;
      font-size: 12px;
    }
  }
}

.status-action {
  color: $c-secondary-grey;

  &--progress {
    color: $c-warning-orange;
  }

  &--completed {
    color: $c-success-green;
  }

  &--error {
    color: $c-error-red;
  }
}

.alert-icon {
  margin-left: 0.5em;
}
</style>
