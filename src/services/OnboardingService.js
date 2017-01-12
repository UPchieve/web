import AuthService from './AuthService'
import NetworkService from './NetworkService'

import {router} from '../main'

let REQUIRED_PROFILE_FIELDS = [ 'name' ]

const SERVER_ROOT = 'http://localhost:3000',
      API_ROOT = `${SERVER_ROOT}/api`

export default {

  sendVerification(){

  },

  sendVerification(context, redirect){
    NetworkService.sendVerification(context).then((res) => {
      console.log(res.data);
      // router.go(redirect || '/')
    }, (res) => {
      context.error = 'Error occurred';
      console.log(res);
    })
  },

  hasVerifiedEmail(){
    return true;
  },

  hasProfile(){
    return true;
  },

  getOnboardingRoute(){
    let map = {
      '/onboarding/verify': this.hasVerifiedEmail,
      '/onboarding/profile': this.hasProfile
    }

    let matched;

    Object.keys(map).some((r) => {
      if (!map[r]()){
        // If step has not been completed, set route and exit
        matched = r;
        return true;
      }
    });
    return matched;
  }

}
