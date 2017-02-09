import NetworkService from './NetworkService'

import {router} from '../main'

export default {
  setProfile(context, data, redirect){
    NetworkService.setProfile(context, data).then((res) => {
      context.msg = 'Set!'
      if (redirect){
        router.push(redirect)
      }
    }, (res) => {
      context.msg = 'Error occurred';
      console.log(res);
    })
  }
}
