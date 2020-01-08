export const topics = {
  math: {
    subtopics: {
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
  }
};

/**
 * Object containing subtopic information from all topics
 */
export function allSubtopics() {
  return Object.entries(topics)
    .flatMap(([, topicObj]) => Object.entries(topicObj.subtopics))
    .reduce((result, [key, subtopicObj]) => {
      result[key] = subtopicObj;
      return result;
    }, {});
}

/**
 * Array of all subtopic names
 */
export function allSubtopicNames() {
  return Object.keys(allSubtopics());
}
