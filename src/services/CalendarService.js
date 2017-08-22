import NetworkService from './NetworkService'

export default {

  initAvailability(context, userid){
    NetworkService.initAvailability(context, { userid: userid });
  },
  getAvailability(context, userid){
    return NetworkService.getAvailability(context, { userid: userid }).then((res) => {
      var availability = res.data.availability;
      return availability;
    });
  },
  updateAvailability(context, userid, availability){
    NetworkService.updateAvailability(context, { userid: userid, availability: availability });
  }
};
