import NetworkService from './NetworkService'

export default {
  questions: [],
  index: 0,
  startQuiz(context){
    return NetworkService.getQuestions(context).then((res) => {
      this.questions = res.data.questions;
      var question = this.questions[this.index];
      console.log(this.questions);
      console.log('first question: ', question);
      return question;
    })
  },
  getNextQuestion(context){
    if (this.index < this.questions.length) {
      this.index = this.index + 1;
      var question = this.questions[this.index];
      console.log(question);
      return question;
    }
    return null;
  }
}
