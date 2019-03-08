import NetworkService from './NetworkService'

export default {
  createStudentQuestion (context, data) {
    return NetworkService.createStudentQuestion(context, data).then(
      () => 'sentOK',
      (err) => {
        console.error(new Error('Unable to create a new StudentQuestion'))
        console.log(err)
        return 'notSent'
      }
    )
  },

  getStudentQuestions (context, data) {
    return NetworkService.getStudentQuestions(context, data).then(
      res => res.body,
      (err) => {
        console.error(new Error('Unable to retrieve StudentQuestions'))
        console.log(err)
      }
    )
  },

  answerStudentQuestion (context, data) {
    return NetworkService.answerStudentQuestion(context, data).then(
      () => 'sentOK',
      (err) => {
        console.error(new Error('Unable to send answer'))
        console.log(err)
        return 'notSent'
      }
    )
  },

  getAttachment (context, data) {
    return NetworkService.getAttachment(context, data).then(
      res => res,
      (err) => {
        console.error(new Error('Unable to retrieve attachment'))
        console.log(err)
      }
    )
  }
}
