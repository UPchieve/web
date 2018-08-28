import NetworkService from './NetworkService';

export default {

  initAvailability(context, userid) {
    return NetworkService.initAvailability(context, { userid });
  },
  getAvailability(context, userid) {
    return NetworkService.getAvailability(context, { userid }).then((res) => {
      const availability = res.data.availability;
      return availability;
    });
  },
  updateAvailability(context, userid, availability) {
    return NetworkService.updateAvailability(context, { userid, availability });
  },
};
