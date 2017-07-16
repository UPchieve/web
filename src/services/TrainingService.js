import NetworkService from './NetworkService'

export default {
  displayQuestions(context){
    return NetworkService.getQuestions(context).then((res) => {
      let questions = res.data.questions;
      return questions;
    })
  },
}
