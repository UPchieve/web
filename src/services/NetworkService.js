import Vue from "vue";
import promiseRetry from "promise-retry";
import errcode from "err-code";

const AUTH_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/auth`;
const API_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/api`;
const ELIGIBILITY_API_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/eligibility`;
const CONTACT_API_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/contact`;

const FAULT_TOLERANT_HTTP_TIMEOUT = 10000;
const FAULT_TOLERANT_HTTP_MAX_RETRY_TIMEOUT = 100000;
const FAULT_TOLERANT_HTTP_MAX_RETRIES = 10;

export default {
  _successHandler(res) {
    return Promise.resolve(res);
  },
  _errorHandler(res) {
    return Promise.reject(res);
  },
  _faultTolerantHttp(http, method, onRetry, url, data) {
    const promiseToRetry = () => {
      return (["get", "delete", "head", "jsonp"].indexOf(method) !== -1
        ? http[method](url, {
            timeout: FAULT_TOLERANT_HTTP_TIMEOUT
          })
        : http[method](url, data, {
            timeout: FAULT_TOLERANT_HTTP_TIMEOUT
          })
      ).then(this._successHandler, this._errorHandler);
    };

    // object property specifying whether this function is aborted
    const requestState = { isAborted: false };

    return promiseRetry(
      retry => {
        if (requestState.isAborted) {
          // early exit
          throw errcode(new Error("Aborted by user"), "EUSERABORTED");
        }

        return promiseToRetry().catch(res => {
          if (res.status === 0) {
            if (onRetry) {
              onRetry(res, () => {
                requestState.isAborted = true;
              });
            }
            retry(res);
          }

          throw res;
        });
      },
      {
        retries: FAULT_TOLERANT_HTTP_MAX_RETRIES,
        maxTimeout: FAULT_TOLERANT_HTTP_MAX_RETRY_TIMEOUT
      }
    );
  },

  // Server route defintions
  login(context, data) {
    return context.$http
      .post(`${AUTH_ROOT}/login`, data)
      .then(this._successHandler, this._errorHandler);
  },
  logout(context) {
    return context.$http
      .get(`${AUTH_ROOT}/logout`)
      .then(this._successHandler, this._errorHandler);
  },
  checkCode(context, data) {
    return context.$http
      .post(`${AUTH_ROOT}/register/check`, data)
      .then(this._successHandler, this._errorHandler);
  },
  checkRegister(context, data) {
    return context.$http
      .post(`${AUTH_ROOT}/register/checkcred`, data)
      .then(this._successHandler, this._errorHandler);
  },
  checkStudentPartnerSignupCode(partnerSignupCode) {
    return Vue.http
      .get(
        `${AUTH_ROOT}/partner/student/code?partnerSignupCode=${encodeURIComponent(
          partnerSignupCode
        )}`
      )
      .then(this._successHandler, this._errorHandler);
  },
  getVolunteerPartner(partnerId) {
    return Vue.http
      .get(
        `${AUTH_ROOT}/partner/volunteer?partnerId=${encodeURIComponent(
          partnerId
        )}`
      )
      .then(this._successHandler, this._errorHandler);
  },
  getStudentPartner(partnerId) {
    return Vue.http
      .get(
        `${AUTH_ROOT}/partner/student?partnerId=${encodeURIComponent(
          partnerId
        )}`
      )
      .then(this._successHandler, this._errorHandler);
  },
  registerVolunteer(context, data) {
    return context.$http
      .post(`${AUTH_ROOT}/register/volunteer`, data)
      .then(this._successHandler, this._errorHandler);
  },
  registerStudent(context, data) {
    return context.$http
      .post(`${AUTH_ROOT}/register/student`, data)
      .then(this._successHandler, this._errorHandler);
  },
  sendReset(context, data) {
    return context.$http
      .post(`${AUTH_ROOT}/reset/send`, data)
      .then(this._successHandler, this._errorHandler);
  },
  confirmReset(context, data) {
    return context.$http
      .post(`${AUTH_ROOT}/reset/confirm`, data)
      .then(this._successHandler, this._errorHandler);
  },
  verifyReset(context, data) {
    return context.$http
      .post(`${AUTH_ROOT}/reset/verify`, data)
      .then(this._successHandler, this._errorHandler);
  },
  user(context) {
    return context.$http
      .get(`${API_ROOT}/user`)
      .then(this._successHandler, this._errorHandler);
  },
  userGlobal() {
    return Vue.http
      .get(`${API_ROOT}/user`)
      .then(this._successHandler, this._errorHandler);
  },
  volunteerStats(context) {
    return context.$http
      .get(`${API_ROOT}/user/volunteer-stats`)
      .then(this._successHandler, this._errorHandler);
  },
  sendVerification(context) {
    return context.$http
      .post(`${API_ROOT}/verify/send`)
      .then(this._successHandler, this._errorHandler);
  },
  confirmVerification(context, data) {
    return context.$http
      .post(`${API_ROOT}/verify/confirm`, data)
      .then(this._successHandler, this._errorHandler);
  },
  sendContact(context, data) {
    return context.$http
      .post(`${CONTACT_API_ROOT}/send`, data)
      .then(this._successHandler, this._errorHandler);
  },
  setProfile(data) {
    return Vue.http
      .put(`${API_ROOT}/user`, data)
      .then(this._successHandler, this._errorHandler);
  },
  getVolunteersAvailability(context, data) {
    return context.$http
      .get(`${API_ROOT}/volunteers/availability/${data}`)
      .then(this._successHandler, this._errorHandler);
  },
  getVolunteers(context) {
    return context.$http
      .get(`${API_ROOT}/volunteers`)
      .then(this._successHandler, this._errorHandler);
  },
  newSession(context, data, onRetry) {
    return this._faultTolerantHttp(
      context.$http,
      "post",
      onRetry,
      `${API_ROOT}/session/new`,
      data
    );
  },
  endSession(context, data) {
    return context.$http
      .post(`${API_ROOT}/session/end`, data)
      .then(this._successHandler, this._errorHandler);
  },
  checkSession(context, data, onRetry) {
    return this._faultTolerantHttp(
      context.$http,
      "post",
      onRetry,
      `${API_ROOT}/session/check`,
      data
    );
  },
  currentSession(context, data) {
    return context.$http
      .post(`${API_ROOT}/session/current`, data)
      .then(this._successHandler, this._errorHandler);
  },
  latestSession(context, data) {
    return context.$http
      .post(`${API_ROOT}/session/latest`, data)
      .then(this._successHandler, this._errorHandler);
  },
  reportSession({ sessionId, reportMessage }) {
    return Vue.http
      .post(`${API_ROOT}/session/${sessionId}/report`, { reportMessage })
      .then(this._successHandler, this._errorHandler);
  },
  adminGetSessions({
    page,
    showBannedUsers,
    showTestUsers,
    sessionActivityFrom,
    sessionActivityTo,
    minMessagesSent,
    minSessionLength
  }) {
    const queryString = new URLSearchParams({
      page,
      showBannedUsers,
      showTestUsers,
      sessionActivityFrom,
      sessionActivityTo,
      minMessagesSent,
      minSessionLength
    }).toString();

    return Vue.http
      .get(`${API_ROOT}/sessions?${queryString}`)
      .then(this._successHandler, this._errorHandler);
  },
  adminGetSession(sessionId) {
    return Vue.http
      .get(`${API_ROOT}/session/${sessionId}`)
      .then(this._successHandler, this._errorHandler);
  },
  adminGetUser(userId) {
    return Vue.http
      .get(`${API_ROOT}/user/${userId}`)
      .then(this._successHandler, this._errorHandler);
  },
  getQuestions(context, data) {
    return context.$http
      .post(`${API_ROOT}/training/questions`, data)
      .then(this._successHandler, this._errorHandler);
  },
  getQuizScore(context, data) {
    return context.$http
      .post(`${API_ROOT}/training/score`, data)
      .then(this._successHandler, this._errorHandler);
  },
  getReviewMaterials(context, data) {
    return context.$http
      .get(`${API_ROOT}/training/review/${data}`)
      .then(this._successHandler, this._errorHandler);
  },
  updateSchedule(context, data) {
    return context.$http
      .post(`${API_ROOT}/calendar/save`, data)
      .then(this._successHandler, this._errorHandler);
  },
  searchSchool(context, { query }) {
    return context.$http
      .get(
        `${ELIGIBILITY_API_ROOT}/school/search?q=${encodeURIComponent(query)}`
      )
      .then(this._successHandler, this._errorHandler);
  },
  checkStudentEligibility(
    context,
    { schoolUpchieveId, zipCode, referredByCode }
  ) {
    return context.$http
      .post(`${ELIGIBILITY_API_ROOT}/check`, {
        schoolUpchieveId,
        zipCode,
        referredByCode
      })
      .then(this._successHandler, this._errorHandler);
  },
  joinSchoolApprovalWaitlist(context, { schoolUpchieveId, email }) {
    return context.$http
      .post(`${ELIGIBILITY_API_ROOT}/school/approvalnotify`, {
        schoolUpchieveId,
        email
      })
      .then(this._successHandler, this._errorHandler);
  },
  checkIfMessageIsClean(context, data) {
    return context.$http
      .post(`${API_ROOT}/moderate/message`, data)
      .then(this._successHandler, this._errorHandler);
  },
  feedback(context, data) {
    return context.$http
      .post(`${API_ROOT}/feedback`, data)
      .then(this._successHandler, this._errorHandler);
  },
  savePushToken(context, data) {
    return context.$http
      .post(`${API_ROOT}/push-token/save`, data)
      .then(this._successHandler, this._errorHandler);
  }
};
