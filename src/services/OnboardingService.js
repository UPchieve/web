import AuthService from 'AuthService'

let REQUIRED_PROFILE_FIELDS = [ 'name' ]

export default {

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
