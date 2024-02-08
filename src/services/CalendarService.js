import NetworkService from './NetworkService'

export default {
  updateSchedule(context, availability, tz) {
    context.$store.dispatch('user/updateAvailability', availability)
    context.$store.dispatch('user/updateTimezone', tz)
    return NetworkService.updateSchedule({ availability, tz })
  },

  getWaitTimes() {
    return NetworkService.getWaitTimes()
      .then((response) => response.data.heatMap)
      .catch(() => ({
        /* return empty waittimes object */
      }))
  },
}
