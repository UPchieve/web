/**
 * Starts a new session for the specified topic and subtopic.
 * @param {VueRouter} router
 * @param {string} topic e.g. "math"
 * @param {string} subtopic e.g. "algebra"
 */
export const startSession = (router, topic, subtopic) =>
  router.push(`/session/${topic.toLowerCase()}/${subtopic.toLowerCase()}`);
