import NetworkService from "./NetworkService";

export default {
  updateAvailability(context, userid, availability) {
    context.$store.dispatch("user/updateAvailability", availability);
    return NetworkService.updateAvailability(context, { userid, availability });
  },
  updateTimezone(context, userid, tz) {
    context.$store.dispatch("user/updateTimezone", tz);
    return NetworkService.updateTimezone(context, { userid, tz });
  }
};
