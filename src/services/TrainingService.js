import NetworkService from './NetworkService'

export default {
  questions: [],
  index: 0,
  startQuiz(context, quizType){
    this.index = 0;
    return NetworkService.getQuestions(context, { quizType: quizType }).then((res) => {
      this.questions = res.data.questions;
      var question = this.questions[this.index];
      console.log(this.questions);
      console.log('first question: ', question);
      console.log(this.questions);
      return question;
    });
  },
  hasNext(context){
    console.log('has next');
    return ((this.index + 1) < this.questions.length);
  },
  hasPrevious(context){
    console.log('has previous');
    return ((this.index) > 0);
  },
  getNextQuestion(context, picked){
    if (this.index < this.questions.length) {
      this.index = this.index + 1;
      var question = this.questions[this.index];
      console.log(question);
      return question;
    }
    return null;
  },
  getPreviousQuestion(context){
    if (this.index > 0) {
      this.index = this.index - 1;
      var question = this.questions[this.index];
      console.log(question);
      return question;
    }
    return null;
  },
  saveAnswer(context, picked){
    var question = this.questions[this.index];
    question.picked = picked;
    return;
  },
  submitQuiz(context){
    var correctAnswers = 0;
    this.questions.forEach(function(item, index){
      if (item.picked == item.correctAnswer) {
        correctAnswers = correctAnswers + 1;
      }
    });
    return correctAnswers;
  }
}
