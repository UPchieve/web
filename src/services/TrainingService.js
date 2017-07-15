import NetworkService from './NetworkService'

export default {
  displayQuestion(context){
    return NetworkService.getQuestion(context).then((res) => {
      let question = res.data.question;
      return question;
    })
  },
}
