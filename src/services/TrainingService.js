import NetworkService from './NetworkService'

export default {
  displayQuestion(context){
    return NetworkService.getQuestion(context).then((res) => {
      let questionText = res.data.question.questionText;
      return questionText;
    })
  },
}
