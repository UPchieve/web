import NetworkService from './NetworkService'

export default {
  startQuiz(context){
    return NetworkService.createQuiz(context)
    .then(() => {
      var quiz = context.quiz;
      console.log('end of quiz service reached');
      context.msg = 'Quiz started!';
    })
  },
};
