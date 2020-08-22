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
        <training-drop-down
          :headers="['Training', 'Progress', 'Actions']"
          :certData="currentSubject.training"
          trainingCourse
        />
      </accordion-item>

      <accordion-item
        label="Subject Certifications"
        sublabel="Complete at least 1 certification quiz in order to begin tutoring students"
        buttonSize="large"
      >
        <training-drop-down
          :headers="['Certification', 'Included Subjects', 'Actions']"
          :certData="currentSubject.certifications"
        />
      </accordion-item>

      <accordion-item
        :label="additionalSubjectsAccordionHeader.header"
        :sublabel="additionalSubjectsAccordionHeader.subheader"
        buttonSize="large"
        v-if="currentSubject.additionalSubjects.length > 0"
      >
        <training-drop-down
          :headers="additionalSubjectsColHeaders"
          :certData="currentSubject.additionalSubjects"
        />
      </accordion-item>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
import AccordionItem from "@/components/AccordionItem";
import TrainingDropDown from "@/components/TrainingDropDown";

export default {
  name: "Training",
  components: {
    AccordionItem,
    TrainingDropDown
  },
  data() {
    return {
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
    ...mapState({
      user: state => state.user.user
    }),
    currentSubject() {
      return this[this.currentSubjectType];
    },
    requiredTrainingMessage() {
      let amount = 0;
      for (let subject of this.currentSubject.training) {
        if (!this.user.trainingCourses[subject.key].isComplete) amount++;
      }

      if (!amount) return "";
      if (amount === 1) return `${amount} course required`;
      return `${amount} courses required`;
    },
    isMathSubject() {
      return this.currentSubjectType === "math";
    },
    additionalSubjectsColHeaders() {
      if (this.currentSubjectType === "math")
        return ["Integrated Math", "Included Certifications", ""];
      if (this.currentSubjectType === "college")
        return ["Additional Subjects", "Required Training", ""];
      else return ["Additional Subjects", "Included Certifications", ""];
    },
    additionalSubjectsAccordionHeader() {
      if (this.currentSubjectType === "math")
        return {
          header: "Integrated Math",
          subheader: "Click here to learn more about Integrated Math"
        };
      else
        return {
          header: "Additional Subjects",
          subheader:
            "Tutor for these subjects automatically by completing the required training courses"
        };
    }
  },

  methods: {
    showSubjectTraining(subject) {
      this.currentSubjectType = subject;
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

.instructions {
  text-align: left;
  font-size: 16px;
  color: $c-secondary-grey;
}

.subject-types {
  @include flex-container(row, space-around, center);
  margin-top: 2em;

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
</style>
