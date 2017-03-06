import NetworkService from './NetworkService'
import AuthService from './AuthService'
import OnboardingService from './OnboardingService'

import {router} from '../router'

export default {
  getAuth(){
    return AuthService.user
  },
  getUser(){
    var auth = this.getAuth();
    if (auth.authenticated){
      return auth.data;
    } else {
      return {};
    }
  },
  getBirthDate(){
    var user = this.getUser(),
        month = user.month,
        day = user.day,
        year = user.year;
    if (month && day && year){
      return `${month}/${day}/${year}`;
    } else {
      return '';
    }
  },
  getOnboarding(){
    return OnboardingService.status;
  },
  setProfile(context, data, redirect){
    NetworkService.setProfile(context, data).then((res) => {
      console.log(res.data);
      if (res.data){
        AuthService.storeUser(res.data.user)
        context.msg = 'Set!'
      } else {
        throw new Error();
      }
      if (redirect){
        router.push(redirect)
      }
    }, (res) => {
      context.msg = 'Error occurred';
      console.log(res);
    })
  }
}
