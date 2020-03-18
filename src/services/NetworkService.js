import Vue from "vue";

const AUTH_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/auth`;
const API_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/api`;
const SCHOOL_API_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/school`;
const CONTACT_API_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/contact`;

export default {
  _successHandler(res) {
    return Promise.resolve(res);
  },
  _errorHandler(res) {
    return Promise.reject(res);
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
  register(context, data) {
    return context.$http
      .post(`${AUTH_ROOT}/register`, data)
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
  userGlobal(Vue) {
    return Vue.http
      .get(`${API_ROOT}/user`)
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
  setProfile(context, data) {
    return context.$http
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
  newSession(context, data) {
    return context.$http
      .post(`${API_ROOT}/session/new`, data)
      .then(this._successHandler, this._errorHandler);
  },
  endSession(context, data) {
    return context.$http
      .post(`${API_ROOT}/session/end`, data)
      .then(this._successHandler, this._errorHandler);
  },
  checkSession(context, data) {
    return context.$http
      .post(`${API_ROOT}/session/check`, data)
      .then(this._successHandler, this._errorHandler);
  },
  currentSession(context, data) {
    return context.$http
      .post(`${API_ROOT}/session/current`, data)
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
      .get(`${SCHOOL_API_ROOT}/search?q=${encodeURIComponent(query)}`)
      .then(this._successHandler, this._errorHandler);
  },
  checkSchoolApproval(context, { schoolUpchieveId }) {
    return context.$http
      .post(`${SCHOOL_API_ROOT}/check`, { schoolUpchieveId })
      .then(this._successHandler, this._errorHandler);
  },
  joinSchoolApprovalWaitlist(context, { schoolUpchieveId, email }) {
    return context.$http
      .post(`${SCHOOL_API_ROOT}/approvalnotify`, { schoolUpchieveId, email })
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
  }
};
