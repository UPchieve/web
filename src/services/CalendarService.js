import NetworkService from "./NetworkService";

export default {
  updateAvailability(context, userid, availability) {
    return NetworkService.updateAvailability(context, { userid, availability });
  },
  updateTimezone(context, userid, tz) {
    return NetworkService.updateTimezone(context, { userid, tz });
  }
};
