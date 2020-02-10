import NetworkService from "./NetworkService";

export default {
  updateSchedule(context, availability, tz) {
    context.$store.dispatch("user/updateAvailability", availability);
    context.$store.dispatch("user/updateTimezone", tz);
    return NetworkService.updateSchedule(context, { availability, tz });
  }
};
