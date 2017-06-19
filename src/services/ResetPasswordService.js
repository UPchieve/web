import Validator from 'validator';

import {router} from '../router'

import NetworkService from './NetworkService'

export default {
  data: {
    email: null,
    validEmail: false
  },

  checkEmail(context, email) {
    return NetworkService.checkEmail(context, { email }).then((res) => {
      let data = res.data || {};

      this.data.validEmail = data.valid === true;

      if (data.valid){
        this.data.email = email;
      }

      return this.data.validEmail;
    });
  }
};
