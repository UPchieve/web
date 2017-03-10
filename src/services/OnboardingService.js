import UserService from './UserService'
import NetworkService from './NetworkService'

import {router} from '../router'

let REQUIRED_PROFILE_FIELDS = [ 'name' ]

export default {
  status: {
    isOnboarded: false
  },

  sendVerification(context){
    return NetworkService.sendVerification(context)
      .then(() => {
        context.msg = 'Email sent!';
      })
      .catch(() => {
        context.msg = 'Error occurred';
      })
  },
  confirmVerification(context, token){
    return NetworkService.confirmVerification(context, {
      token: token
    }).then(() => {
      let user = UserService.getUser();
      user.verified = true;
      router.replace('/');
    })
    .catch(() => {
      context.msg = 'Error occurred';
    })
  },

  hasVerifiedEmail(){
    var user = UserService.getUser();
    return user.verified;
  },

  hasProfile(){
    var user = UserService.getUser();
    return user.firstname && user.lastname && user.day && user.month && user.year;
  },


  isOnboarded(){
    return this.hasVerifiedEmail() && this.hasProfile();
  },

  getOnboardingRoute(){
    // Map each route to function that will show route if false
    let map = {
      '/verify': this.hasVerifiedEmail,
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
