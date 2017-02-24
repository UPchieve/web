import Validator from 'validator';

import {router} from '../main'

import NetworkService from './NetworkService'


const SERVER_ROOT = 'http://localhost:3000',
      AUTH_ROOT = `${SERVER_ROOT}/auth`;

export default {
  data: {
    registrationCode: null,
    validRegistrationCode: false
  },

  checkCode(context, code){
    return NetworkService.checkCode(context, { code }).then((res) => {
      let data = res.data || {};

      this.data.validRegistrationCode = data.valid === true;

      if (data.valid){
        this.data.registrationCode = code;
      }

      return this.data.validRegistrationCode;
    })
  }
};
