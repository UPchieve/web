const AUTH_ROOT = `${process.env.SERVER_ROOT}/auth`,
    API_ROOT = `${process.env.SERVER_ROOT}/api`

export default {
  _successHandler(res){
    return Promise.resolve(res)
  },
  _errorHandler(res){
    return Promise.reject(res)
  },

  // Server route defintions
  login(context, data){
    return context.$http.post(`${AUTH_ROOT}/login`, data).then(this._successHandler, this._errorHandler)
  },
  logout(context){
    return context.$http.get(`${AUTH_ROOT}/logout`).then(this._successHandler, this._errorHandler)
  },
  checkCode(context, data){
    return context.$http.post(`${AUTH_ROOT}/register/check`, data).then(this._successHandler, this._errorHandler)
  },
  register(context, data){
    return context.$http.post(`${AUTH_ROOT}/register`, data).then(this._successHandler, this._errorHandler)
  },


  user(context){
    return context.$http.get(`${API_ROOT}/user`).then(this._successHandler, this._errorHandler)
  },
  sendVerification(context){
    return context.$http.post(`${API_ROOT}/verify/send`).then(this._successHandler, this._errorHandler)
  },
  confirmVerification(context, data){
    return context.$http.post(`${API_ROOT}/verify/confirm`, data).then(this._successHandler, this._errorHandler)
  },
  setProfile(context, data){
    return context.$http.put(`${API_ROOT}/user`, data).then(this._successHandler, this._errorHandler)
  },

  newSession(context, data){
    return context.$http.post(`${API_ROOT}/session/new`, data).then(this._successHandler, this._errorHandler)
  },
  checkSession(context, data){
    return context.$http.post(`${API_ROOT}/session/check`, data).then(this._successHandler, this._errorHandler)
  },

  sendReset(context, data){
    return context.$http.post(`${API_ROOT}/reset/send`).then(this._successHandler, this._errorHandler)
  },
  confirmReset(context, data){
    return context.$http.post(`${API_ROOT}/reset/confirm`, data).then(this._successHandler, this._errorHandler)
  },
}
