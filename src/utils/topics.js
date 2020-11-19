export const topics = {
  math: {
    subtopics: {
      prealgebra: { displayName: "Pre-algebra" },
      algebraOne: { displayName: "Algebra 1" },
      algebraTwo: { displayName: "Algebra 2" },
      geometry: { displayName: "Geometry" },
      trigonometry: { displayName: "Trigonometry" },
      statistics: { displayName: "Statistics" },
      precalculus: { displayName: "Precalculus" },
      calculusAB: { displayName: "Calculus AB" },
      calculusBC: { displayName: "Calculus BC" },
      integratedMathOne: { displayName: "Integrated Math 1" },
      integratedMathTwo: { displayName: "Integrated Math 2" },
      integratedMathThree: { displayName: "Integrated Math 3" },
      integratedMathFour: { displayName: "Integrated Math 4" }
    },
    displayName: "Math Tutoring"
  },
  science: {
    subtopics: {
      biology: { displayName: "Biology" },
      chemistry: { displayName: "Chemistry" },
      physicsOne: { displayName: "Physics 1" },
      physicsTwo: { displayName: "Physics 2" },
      environmentalScience: { displayName: "Environmental Science" }
    },
    displayName: "Science Tutoring"
  },
  college: {
    subtopics: {
      planning: { displayName: "Planning" },
      essays: { displayName: "Essays" },
      applications: { displayName: "Applications" }
    },
    displayName: "College Counseling"
  },
  training: {
    subtopics: {
      upchieve101: { displayName: "UPchieve 101" },
      tutoringSkills: { displayName: "Tutoring Skills" },
      collegeSkills: { displayName: "College Counseling Skills" }
    },
    displayName: "UPchieve Training"
  },
  sat: {
    subtopics: {
      satMath: { displayName: "SAT Math" },
      satReading: { displayName: "SAT Reading" }
    },
    displayName: "Standardized Testing"
  }
};

/**
 * Object containing subtopic information from all topics
 */
export function allSubtopics() {
  let subtopicObj = {};

  for (let topic in topics) {
    if (topics.hasOwnProperty(topic)) {
      subtopicObj = Object.assign(subtopicObj, topics[topic].subtopics);
    }
  }

  return subtopicObj;
}

/**
 * Array of all subtopic names
 */
export function allSubtopicNames() {
  return Object.keys(allSubtopics());
}
