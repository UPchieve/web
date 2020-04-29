export const topics = {
  math: {
    subtopics: {
      prealgebra: { displayName: "Pre-algebra" },
      algebra: { displayName: "Algebra" },
      geometry: { displayName: "Geometry" },
      trigonometry: { displayName: "Trigonometry" },
      precalculus: { displayName: "Precalculus" },
      calculus: { displayName: "Calculus" }
    },
    displayName: "Math Tutoring"
  },
  college: {
    subtopics: {
      planning: { displayName: "Planning" },
      essays: { displayName: "Essays" },
      applications: { displayName: "Applications" }
    },
    displayName: "College Counseling"
  },
  science: {
    subtopics: {
      biology: { displayName: "Biology" }
    },
    displayName: "Science Tutoring"
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
