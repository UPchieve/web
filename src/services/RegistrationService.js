import NetworkService from "./NetworkService";

export default {
  data: {
    registrationCode: null,
    isValidRegistrationCode: false
  },

  checkCode(context, code) {
    return NetworkService.checkCode(context, { code })
      .then(res => {
        const data = res.data || {};

        this.data.isValidRegistrationCode = data.isValid === true;

        if (this.data.isValidRegistrationCode) {
          this.data.registrationCode = code;
        }

        return this.data.isValidRegistrationCode;
      })
      .catch(() => {
        return false;
      });
  }
};
