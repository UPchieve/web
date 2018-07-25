import NetworkService from './NetworkService';

export default {
  checkIfMessageIsClean(context, data) {
    return NetworkService.checkIfMessageIsClean(context, { msg: data }).then(
      (res) => {
        return res.body.isClean;
      },
      (err) => {
        console.error(new Error('Unable to check if message is clean'));
        console.log(err);
        return false;
      }
    );
  }
}
