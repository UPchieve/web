export const topics = {
  math: {
    subtopics: {
      prealgebra: { displayName: "Pre-algebra" },
      algebra: { displayName: "Algebra" },
      geometry: { displayName: "Geometry" },
      trigonometry: { displayName: "Trigonometry" },
      precalculus: { displayName: "Precalculus" },
      calculus: { displayName: "Calculus" },
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
      physicsOne: { displayName: "Physics 1" }
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
