import SessionService from "@/services/SessionService";

/**
 * Starts a new session for the specified topic and subtopic.
 * @param {VueRouter} router
 * @param {string} topic e.g. "math"
 * @param {string} subtopic e.g. "algebra"
 */
export const startSession = (router, topic, subtopic) =>
  router.push(`/session/${topic.toLowerCase()}/${subtopic.toLowerCase()}`);

/**
 * Rejoins an existing session.
 * @param {VueRouter} router
 * @param {string} sessionPath
 */
export const rejoinSession = (router, sessionPath) => {
  if (sessionPath) router.push(sessionPath);
};

/**
 * Ends the current session.
 * @param {object} context
 */
export const endSession = context => {
  const sessionId = context.$store.state.user.session._id;
  SessionService.endSession(context, sessionId)
    .then(() => {
      context.$socket.disconnect();
      context.$router.replace("/");
      context.$store.dispatch("user/fetch", context);
      context.$store.dispatch("app/modal/hide");
    })
    .catch(() => window.alert("Could not end session"));
};
