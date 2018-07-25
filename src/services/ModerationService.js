import NetworkService from './NetworkService';

export default {
  checkIfMessageIsClean(context, data) {
    NetworkService.checkIfMessageIsClean(context, { msg: data }).then(
      (res) => {
        console.log(res.body);
        return true;
      },
      (err) => {
        console.error(new Error('Unable to check if message is clean'));
        console.log(err);
        return false;
      }
    );
  }
}
