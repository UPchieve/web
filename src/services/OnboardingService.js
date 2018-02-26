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
    var user = UserService.getUser(),
        requiredFields;

    if (user.isVolunteer){
      requiredFields = ['firstname', 'lastname'];
    } else {
      requiredFields = [
        'firstname', 'lastname', 'birthdate', 'gender', 'race', 'expectedGraduation'
      ];
    }

    // Test if each required field is present, return true when field fails to terminate iteration
    var hasInvalidField = requiredFields.some((fieldName) => {
      var field = user[fieldName];
      if (field == null){
        return true; // Field must be non-null
      } else if (Array.isArray(field) && field.length === 0){
        return true; // If field is an array, it must be populated
      } else if (typeof field === 'string' && field === ''){
        return true; // If field is a string, it must be non-empty
      } else {
        return false;
      }
    })

    return !hasInvalidField;
  },


  isOnboarded(){
    return this.hasVerifiedEmail() && this.hasProfile();
  },

  getOnboardingRoute(){
    // Map each route to function that will show route if false
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
