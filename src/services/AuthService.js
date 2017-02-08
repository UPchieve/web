import Validator from 'validator';

import {router} from '../main'

import NetworkService from './NetworkService'

import jQuery from 'jquery';


const SERVER_ROOT = 'http://localhost:3000',
      AUTH_ROOT = `${SERVER_ROOT}/auth`,
      USER_FETCH_LIMIT_SECONDS = 5

export default {
  user: {
    authenticated: false,
    data: null,
    lastFetch: 0
  },

  login(context, creds, redirect){
    let {email, password} = creds;
    if (!email || !password || !Validator.isEmail(email) || password.length < 1){
      return;
    }

    NetworkService.login(context, creds).then((res) => {
      let data = res.data;
      if (!data){
        throw new Error('No user returned from auth service');
      }

      this.user.authenticated = true;
      this.user.data = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));

      if(redirect) {
        router.push(redirect)
      }
    }, (res) => {
      context.error = 'Error occurred';
      console.log(res);
    })
  },

  register(context, creds, redirect){
    NetworkService.register(context, creds).then((res) => {
      let data = res.data;
      if (!data){
        throw new Error('No user returned from auth service');
      }

      this.user.authenticated = true;
      this.user.data = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));

      if(redirect) {
        router.push(redirect)
      }
    })
  },

  logout(context){
    NetworkService.logout(context).then((res) => {
      localStorage.removeItem('user');
      this.user.authenticated = false;
      this.user.data = null;
      router.push('/login');
    });
  },

  checkAuth(context){
    let user = localStorage.getItem('user');
    if (user){
      try {
        this.user.data = JSON.parse(user);
        this.user.authenticated = true;
      } catch (e) {
        this.logout(); // Error in LocalStorage, so logout
      }
    } else {
      this.user.authenticated = false;
      this.user.data = null;
    }

    if (context && this.shouldFetch()){
      this.fetchUser(context);
    }
  },

  shouldFetch(){
    return (Date.now() - this.user.lastFetch) > USER_FETCH_LIMIT_SECONDS * 1000
  },

  fetchUser(context){
    this.user.lastFetch = Date.now();

    NetworkService.user(context).then((res) => {
      let data = res.data;
      if (!data){
        throw new Error('No user returned from auth service');
      }

      if (data.user){
        this.user.authenticated = true;
        this.user.data = data.user;
        localStorage.setItem('user', JSON.stringify(data.user));
      } else {
        this.user.authenticated = false;
        this.user.data = null;
      }
    }).catch((err) => {
      console.log(err);
    })
  }
};
