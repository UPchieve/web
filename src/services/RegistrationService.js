import NetworkService from './NetworkService'

export default {
  data: {
    registrationCode: null,
    validRegistrationCode: false
  },

  checkCode (context, code) {
    return NetworkService.checkCode(context, { code }).then((res) => {
      const data = res.data || {}

      this.data.validRegistrationCode = data.valid === true

      if (data.valid) {
        this.data.registrationCode = code
      }

      return this.data.validRegistrationCode
    })
  }
}
