import Validator from 'validator';

import {router} from '../router'

import NetworkService from './NetworkService'

export default {
  data: {
    emailAddress: null,
    validEmailAddress: false
  },

  checkEmailAddress(context, email){
      return this.data.validEmailAddress;
  }
};
