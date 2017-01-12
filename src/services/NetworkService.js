const SERVER_ROOT = 'http://localhost:3000',
      AUTH_ROOT = `${SERVER_ROOT}/auth`,
      API_ROOT = `${SERVER_ROOT}/api`

export default {
  _successHandler(res){
    console.log(res);
    return Promise.resolve(res)
  },
  _errorHandler(res){
    return Promise.resolve(res)
  },

  // Server route defintions
  login(context, data){
    return context.$http.post(`${AUTH_ROOT}/login`, data).then(this._successHandler, this._errorHandler)
  },
  logout(context, data){
    return context.$http.post(`${AUTH_ROOT}/logout`, data).then(this._successHandler, this._errorHandler)
  },
  register(context, data){
    return context.$http.post(`${AUTH_ROOT}/register`, data).then(this._successHandler, this._errorHandler)
  },

  sendVerification(context){
    return context.$http.post(`${API_ROOT}/verify/send`).then(this._successHandler, this._errorHandler)
  }

}
