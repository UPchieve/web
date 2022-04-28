import NetworkService from './NetworkService'

export default {
  updateSchedule(context, availability, tz) {
    context.$store.dispatch('user/updateAvailability', availability)
    context.$store.dispatch('user/updateTimezone', tz)
    return NetworkService.updateSchedule(context, { availability, tz })
  },

  getWaitTimes(context) {
    return NetworkService.getWaitTimes(context)
      .then(response => response.body.heatMap)
      .catch(() => ({
        /* return empty waittimes object */
      }))
  }
}
