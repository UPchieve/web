import {router} from '../main'


const API_ROOT = 'http://localhost:3000',
      AUTH_ROOT = `${API_ROOT}/auth`

export default {
  currentUser: null,

  login(context, creds, redirect) {
    context.$http.post(`${AUTH_ROOT}/login`, creds).then((data) => {
      console.log(data);
      this.user.authenticated = true

      if(redirect) {
        router.go(redirect)
      }
    })
  },

  register(context, creds, redirect) {
    context.$http.post(`${AUTH_ROOT}/register`, creds).then((data) => {
      console.log(data);
      this.user.authenticated = true

      if(redirect) {
        router.go(redirect)
      }
    })
  },

  checkAuth(){
    // localStorage.getItem('user')

  }
};
