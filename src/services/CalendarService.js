import NetworkService from "./NetworkService";

export default {
  updateAvailability(context, availability) {
    context.$store.dispatch("user/updateAvailability", availability);
    return NetworkService.updateAvailability(context, { availability });
  },
  updateTimezone(context, tz) {
    context.$store.dispatch("user/updateTimezone", tz);
    return NetworkService.updateTimezone(context, { tz });
  }
};
