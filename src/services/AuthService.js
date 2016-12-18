import Validator from 'validator';

import {router} from '../main'


const API_ROOT = 'http://localhost:3000',
      AUTH_ROOT = `${API_ROOT}/auth`

export default {
  currentUser: null,
  isAuthenticated: false, // Expose single property for watching

  login(context, creds, redirect){
    let {email, password} = creds;
    if (!email || !password || !Validator.isEmail(email) || password.length < 1){
      return;
    }

    context.$http.post(`${AUTH_ROOT}/login`, creds).then((res) => {
      let data = res.data;
      if (!data){
        throw new Error('No user returned from auth service');
      }

      this.currentUser = data.user;
      this.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(data.user));

      if(redirect) {
        router.go(redirect)
      }
    }, (res) => {
      context.error = 'Error occurred';
      console.log(res);
    })
  },

  register(context, creds, redirect){
    context.$http.post(`${AUTH_ROOT}/register`, creds).then((res) => {
      let data = res.data;
      if (!data){
        throw new Error('No user returned from auth service');
      }

      this.currentUser = data.user;
      this.isAuthenticated = true;
      localStorage.setItem('user', JSON.stringify(data.user));

      if(redirect) {
        router.go(redirect)
      }
    })
  },

  logout(){
    localStorage.removeItem('user');
    this.currentUser = null;
    this.isAuthenticated = false;
    router.go('/')
  },

  checkAuth(){
    let user = localStorage.getItem('user');
    if (user){
      try {
        this.currentUser = JSON.parse(user);
        this.isAuthenticated = true;
      } catch (e) {
        this.logout(); // Error in LocalStorage, so logout
      }
    } else {
      this.currentUser = null;
      this.isAuthenticated = false;
    }
  },

  getUser(){
    return this.currentUser;
  }
};
