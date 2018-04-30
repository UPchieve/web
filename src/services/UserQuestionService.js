import NetworkService from './NetworkService';

export default {
  createUserQuestion(context, data) {
    return NetworkService.createUserQuestion(context, data).then(
      (res) => {
        return 'sentOK';
      },
      (err) => {
        console.error(new Error('Unable to create a new UserQuestion'));
        console.log(err);
        return 'notSent';
      }
    );
  }
}
