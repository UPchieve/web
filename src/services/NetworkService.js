const AUTH_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/auth`;
const API_ROOT = `${process.env.VUE_APP_SERVER_ROOT}/api`;

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
  user(context) {
    return context.$http
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
  setProfile(context, data) {
    return context.$http
      .put(`${API_ROOT}/user`, data)
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
  initAvailability(context, data) {
    return context.$http
      .post(`${API_ROOT}/calendar/init`, data)
      .then(this._successHandler, this._errorHandler);
  },
  updateAvailability(context, data) {
    return context.$http
      .post(`${API_ROOT}/calendar/save`, data)
      .then(this._successHandler, this._errorHandler);
  },
  getSuggestions(context, data) {
    return context.$http
      .post(`${API_ROOT}/complete`, data)
      .then(this._successHandler, this._errorHandler);
  },
  checkIfMessageIsClean(context, data) {
    return context.$http
      .post(`${API_ROOT}/moderate/message`, data)
      .then(this._successHandler, this._errorHandler);
  },
  getAvailability(context, data) {
    return context.$http
      .post(`${API_ROOT}/calendar/get`, data)
      .then(this._successHandler, this._errorHandler);
  },
  getTimezone(context, data) {
    return context.$http
      .post(`${API_ROOT}/calendar/tz/get`, data)
      .then(this._successHandler, this._errorHandler);
  },
  updateTimezone(context, data) {
    return context.$http
      .post(`${API_ROOT}/calendar/tz/save`, data)
      .then(this._successHandler, this._errorHandler);
  },
  feedback(context, data) {
    return context.$http
      .post(`${API_ROOT}/feedback`, data)
      .then(this._successHandler, this._errorHandler);
  },
  createStudentQuestion(context, data) {
    return context.$http
      .post(`${API_ROOT}/student-questions/create`, data)
      .then(this._successHandler, this._errorHandler);
  },
  getStudentQuestions(context, data) {
    return context.$http
      .post(`${API_ROOT}/student-questions/get`, data)
      .then(this._successHandler, this._errorHandler);
  },
  answerStudentQuestion(context, data) {
    return context.$http
      .post(`${API_ROOT}/student-questions/answer`, data)
      .then(this._successHandler, this._errorHandler);
  },
  getAttachment(context, data) {
    return context.$http
      .get(`${API_ROOT}/download/${data}`)
      .then(this._successHandler, this._errorHandler);
  },
  debugSentryApi(context) {
    return context.$http
      .get(`${API_ROOT}/debug-sentry`)
      .then(this._successHandler, this._errorHandler);
  }
};
