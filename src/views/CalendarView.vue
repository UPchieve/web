<template>
  <div class="calendar-container">
    <div class="calendar">
      <div class="header">
        <div class="instructions-container">
          <div class="header-title">Tell us when to text you!</div>
          <p class="instructions">
            Choose your availability below and we’ll text you when a student
            needs your help. You’re not obligated to tutor every time we text
            you, but try and select times you’re likely to want to help a
            student. Don’t want to wait for a text? You can check your dashboard
            for students who need help at any time.
          </p>
        </div>
        <div class="save-container">
          <div v-if="hasWaitTimes" class="clock-explanation-container">
            <ClockIcon class="clock-explanation-icon" />
            <p class="clock-explanation">
              Times when students are currently waiting the longest for a
              tutor—try and include some of these if you can!
            </p>
          </div>
          <button v-bind:class="saveButtonClass" type="button" @click="save()">
            <span v-html="saveLabel"></span>
          </button>
        </div>
      </div>
      <div v-if="hasUserSchedule">
        <div class="tz-selector-container">
          <span>Time Zone: </span>
          <select
            v-model="selectedTz"
            class="tz-selector"
            @change="tzChanged"
          >
            <option v-for="tz in tzList" :key="tz">
              {{ tz }}
            </option>
          </select>
          <AvailabilityGrid
            :availability="availability"
            :waitTimes="waitTimes"
            @select="updateLocalAvailability"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import _ from 'lodash'
import moment from 'moment-timezone'

import AvailabilityGrid from '@/components/AvailabilityGrid'
import ClockIcon from '@/assets/clock.svg'

import CalendarService from '@/services/CalendarService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

const saveStates = {
  SAVED: 'saved',
  UNSAVED: 'unsaved',
  ERROR: 'error',
  SAVING: 'saving'
}

export default {
  components: { AvailabilityGrid, ClockIcon },
  data() {
    return {
      waitTimes: {},
      availability: {},
      tzList: moment.tz.names(),
      selectedTz: '',
      saveState: saveStates.UNSAVED
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    saveButtonClass() {
      return ['save-button', 'save-button--' + this.saveState]
    },
    saveLabel() {
      switch (this.saveState) {
        case saveStates.SAVED:
          return 'Saved &#x2714;'
        case saveStates.SAVING:
          return 'Saving...'
        default:
          return 'Save'
      }
    },
    sortedTimes() {
      return this.sortTimes()
    },
    hasUserSchedule() {
      return !_.isEmpty(this.availability)
    },
    hasWaitTimes() {
      return !_.isEmpty(this.waitTimes)
    }
  },
  created() {
    this.initScheduleData()
    this.initWaitTimeData()
  },
  methods: {
    tzChanged() {
      this.updateLocalWaitTimes()
      this.someThingChanged()
    },
    updateLocalAvailability(payload) {
      const oldValue = this.availability[payload.day][payload.hour]
      this.availability[payload.day][payload.hour] = !oldValue
      this.someThingChanged()
    },
    async updateLocalWaitTimes() {
      const originalWaitTimes = await CalendarService.getWaitTimes(this)
      const userUtcOffset = moment.tz.zone(this.selectedTz).parse(Date.now())
      const offset = (-1 * userUtcOffset) / 60
      this.waitTimes = this.convertAvailability(originalWaitTimes, offset)
    },
    someThingChanged() {
      this.saveState = saveStates.UNSAVED
    },
    initScheduleData() {
      const userTimezone = this.user.timezone
      const hasValidTimezone = userTimezone && this.userTzInList(userTimezone)
      this.selectedTz = hasValidTimezone ? userTimezone : moment.tz.guess()

      const originalAvailability = this.user.availability
      const estUtcOffset = moment.tz.zone('America/New_York').parse(Date.now())
      const userUtcOffset = moment.tz.zone(this.selectedTz).parse(Date.now())
      const offset = (estUtcOffset - userUtcOffset) / 60
      this.availability = this.convertAvailability(originalAvailability, offset)
    },
    async initWaitTimeData() {
      const userTimezone = this.user.timezone
      const hasValidTimezone = userTimezone && this.userTzInList(userTimezone)
      this.selectedTz = hasValidTimezone ? userTimezone : moment.tz.guess()

      await this.updateLocalWaitTimes()
    },
    sortTimes() {
      const keysMap = {}
      for (const day in this.availability) {
        if (Object.prototype.hasOwnProperty.call(this.availability, day)) {
          const times = this.availability[day]
          const keys = []
          for (const time in times) {
            if (Object.prototype.hasOwnProperty.call(times, time)) {
              keys.push(time)
            }
          }
          if (keys[0] !== '12a') {
            keys.reverse()
          }
          keysMap[day] = keys
        }
      }
      return keysMap
    },
    userTzInList(tz) {
      return this.tzList.includes(tz)
    },
    convertAMPMtoTwentyFourHrs(hour) {
      const hourRegex = /^(\d{1,2})([ap])$/
      // capture the hour and the 'a/p' string
      let [, hr, apm] = hour.match(hourRegex)

      if (apm === 'a') {
        if (hr === '12') {
          return 0
        }
        return parseInt(hr)
      }
      if (hr === '12') {
        return 12
      }
      return parseInt(hr) + 12
    },
    convertTwentyFourHrsToAMPM(hour) {
      if (hour == 0) {
        return '12a'
      }
      if (hour == 12) {
        return '12p'
      }
      if (hour > 12) {
        return hour - 12 + 'p'
      }
      return hour + 'a'
    },
    /**
     * Converts an availability to another timezone offset from America/New_York.
     *
     * @param {availability} the object to convert
     * @param {offset} the user's time zone offset
     * @return the converted availability object
     */
    convertAvailability(availability, rawOffset) {
      // Round down fractional offsets
      const offset = Math.floor(rawOffset)

      const succWeekday = {
        Sunday: 'Monday',
        Monday: 'Tuesday',
        Tuesday: 'Wednesday',
        Wednesday: 'Thursday',
        Thursday: 'Friday',
        Friday: 'Saturday',
        Saturday: 'Sunday'
      }
      const predWeekday = {
        Sunday: 'Saturday',
        Monday: 'Sunday',
        Tuesday: 'Monday',
        Wednesday: 'Tuesday',
        Thursday: 'Wednesday',
        Friday: 'Thursday',
        Saturday: 'Friday'
      }
      const convertedAvailability = {}
      for (const day in availability) {
        const times = availability[day]
        convertedAvailability[day] = {}
        for (const time in times) {
          convertedAvailability[day][time] = false
        }
      }
      for (const day in availability) {
        const times = availability[day]
        for (const time in times) {
          let newDay = day
          let numericHour = this.convertAMPMtoTwentyFourHrs(time)
          let newHour = numericHour + offset
          if (newHour >= 24) {
            newHour -= 24
            newDay = succWeekday[day]
          } else if (newHour < 0) {
            newHour += 24
            newDay = predWeekday[day]
          }
          convertedAvailability[newDay][
            this.convertTwentyFourHrsToAMPM(newHour)
          ] = availability[day][time]
        }
      }
      return convertedAvailability
    },
    save() {
      this.saveState = saveStates.SAVING
      const estUtcOffset = moment.tz.zone('America/New_York').parse(Date.now())
      const userUtcOffset = moment.tz.zone(this.selectedTz).parse(Date.now())
      // offsets returned by zone.utcOffset() are returned in minutes and inverted for POSIX compatibility
      const offset = (userUtcOffset - estUtcOffset) / 60
      CalendarService.updateSchedule(
        this,
        this.convertAvailability(this.availability, offset),
        this.selectedTz
      ).then(response => {
        if (response.status == 200) {
          this.saveState = saveStates.SAVED
          AnalyticsService.captureEvent(EVENTS.AVAILABILITY_UPDATED, {
            event: EVENTS.AVAILABILITY_UPDATED
          })
        } else {
          this.saveState = saveStates.ERROR
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.calendar-container {
  padding: 10px;

  @include breakpoint-above('medium') {
    padding: 40px;
  }
}

.calendar {
  background: #fff;
  border-radius: 8px;
  font-size: 12px;
  color: #343440;
  padding: 20px 15px;

  @include breakpoint-above('medium') {
    padding: 40px;
  }
}

.header {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 24px;
  font-weight: 500;
}

.save-button {
  font-size: 16px;
  font-weight: 600;
  padding: 10px 45px;
  border-radius: 30px;
  color: #fff;
  border: none;
  margin-left: auto;

  &:hover {
    color: #000;
  }

  &--unsaved {
    background: $c-success-green;
  }

  &--saved {
    background: $c-secondary-grey;
  }

  &--error {
    background: $c-error-red !important;
  }

  &--saving {
    background: $c-disabled-grey;
  }
}

input[type='checkbox'] {
  position: absolute;
  display: block;
  opacity: 0;
  width: 100px;
  height: 40px;
}

label {
  width: 100px;
  height: 40px;
  margin: 0;
}

input[type='checkbox']:checked + label {
  background-color: rgba(22, 210, 170, 0.5);
}

.tz-selector-container {
  padding-top: 30px;
}

.tz-selector {
  background-color: white;
}

.instructions-container {
  text-align: left;
}

.instructions {
  font-size: 16px;
  color: $c-secondary-grey;
  margin: 15px 0;
}

.save-container {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.clock-explanation-container {
  display: flex;
  flex-direction: row;
  align-items: center;
}

.clock-explanation {
  text-align: left;
  font-size: 14px;
  margin: 15px 0;
}

.clock-explanation-icon {
  background: none;
  min-width: 20px;
  min-height: 20px;
  margin-right: 10px;
}

@media screen and (max-width: #{get-app-sidebar-width("medium") + 960px}) {
  .calendar-container {
    width: 100%;
    @each $key, $value in $app-sidebar-width-map {
      @if map-get($breakpoint-map, $key) {
        @include breakpoint-above($key) {
          width: calc(100% - #{$value});
        }
      }
    }
    position: absolute;
    overflow-x: hidden;
  }

  input[type='checkbox'] {
    position: relative;
    margin-top: 0;
    margin-bottom: -40px;
  }
}

@media screen and (max-width: get-breakpoint('medium')) {
  .btn {
    padding-top: 0em !important;
    padding-bottom: 0em !important;
  }
}
</style>
