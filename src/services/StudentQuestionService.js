import NetworkService from './NetworkService';

export default {
  createStudentQuestion(context, data) {
    return NetworkService.createStudentQuestion(context, data).then(
      (res) => {
        return 'sentOK';
      },
      (err) => {
        console.error(new Error('Unable to create a new StudentQuestion'));
        console.log(err);
        return 'notSent';
      }
    );
  },

  getStudentQuestions(context, data) {
    return NetworkService.getStudentQuestions(context, data).then(
      (res) => {
        return res.body;
      },
      (err) => {
        console.error(new Error('Unable to retrieve StudentQuestions'));
        console.log(err);
      }
    );
  }
}
