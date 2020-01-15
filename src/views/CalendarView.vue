<template>
  <div class="calendar-container" @change="someThingChanged()">
    <div class="calendar">
      <div class="header">
        <div class="header-title">Schedule</div>
        <button v-bind:class="saveButtonClass" @click="save()">
          <span v-html="saveLabel"></span>
        </button>
      </div>
      <div v-if="hasUserSchedule">
        <div class="tz-selector-container">
          <span>Time Zone: </span>
          <select v-model="selectedTz">
            <option v-for="tz in tzList" :key="tz">
              {{ tz }}
            </option>
          </select>
        </div>
        <div class="dayTimeContainer">
          <div class="timeLabelContainer">
            <div v-for="time in timeRange" :key="time" class="timeLabel">
              {{ time }}
            </div>
          </div>
          <form class="dayTime">
            <div v-for="(dayValue, day) in availability" :key="`day-${day}`">
              <div class="dayLabel">{{ day }}</div>
              <div class="times">
                <div
                  v-for="sortedTime in sortedTimes[day]"
                  :key="sortedTime"
                  class="timeOfDay"
                >
                  <input
                    v-model="availability[day][sortedTime]"
                    type="checkbox"
                  />
                  <label for="sortedTime" />
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";

import _ from "lodash";
import moment from "moment-timezone";

import CalendarService from "@/services/CalendarService";
import AnalyticsService from "@/services/AnalyticsService";

const saveStates = {
  SAVED: "saved",
  UNSAVED: "unsaved",
  ERROR: "error",
  SAVING: "saving"
};

export default {
  data() {
    const timeRange = [
      "12 am",
      "1 am",
      "2 am",
      "3 am",
      "4 am",
      "5 am",
      "6 am",
      "7 am",
      "8 am",
      "9 am",
      "10 am",
      "11 am",
      "12 pm",
      "1 pm",
      "2 pm",
      "3 pm",
      "4 pm",
      "5 pm",
      "6 pm",
      "7 pm",
      "8 pm",
      "9 pm",
      "10 pm",
      "11 pm"
    ];
    return {
      availability: {},
      timeRange,
      tzList: moment.tz.names(),
      selectedTz: "",
      saveState: saveStates.UNSAVED
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    saveButtonClass() {
      return ["save-button", "save-button--" + this.saveState];
    },
    saveLabel() {
      switch (this.saveState) {
        case saveStates.SAVED:
          return "Saved &#x2714;";
        case saveStates.SAVING:
          return "Saving...";
        default:
          return "Save";
      }
    },
    sortedTimes() {
      return this.sortTimes();
    },
    hasUserSchedule() {
      return !_.isEmpty(this.availability);
    }
  },
  created() {
    this.initScheduleData();
  },
  methods: {
    someThingChanged() {
      this.saveState = saveStates.UNSAVED;
    },
    initScheduleData() {
      const userTimezone = this.user.timezone;
      const hasValidTimezone = userTimezone && this.userTzInList(userTimezone);
      this.selectedTz = hasValidTimezone ? userTimezone : moment.tz.guess();

      const originalAvailability = this.user.availability;
      var estUtcOffset = moment.tz.zone("America/New_York").parse(Date.now());
      var userUtcOffset = moment.tz.zone(this.selectedTz).parse(Date.now());
      var offset = (estUtcOffset - userUtcOffset) / 60;
      this.availability = this.convertAvailability(
        originalAvailability,
        offset
      );
    },
    sortTimes() {
      const keysMap = {};
      for (const day in this.availability) {
        if (this.availability.hasOwnProperty(day)) {
          const times = this.availability[day];
          const keys = [];
          for (const time in times) {
            if (times.hasOwnProperty(time)) {
              keys.push(time);
            }
          }
          if (keys[0] !== "12a") {
            keys.reverse();
          }
          keysMap[day] = keys;
        }
      }
      return keysMap;
    },
    userTzInList(tz) {
      return this.tzList.includes(tz);
    },
    convertAMPMtoTwentyFourHrs(hour) {
      const hourRegex = /^(\d{1,2})([ap])$/;
      // capture the hour and the 'a/p' string
      let [, hr, apm] = hour.match(hourRegex);

      if (apm === "a") {
        if (hr === "12") {
          return 0;
        }
        return parseInt(hr);
      }
      if (hr === "12") {
        return 12;
      }
      return parseInt(hr) + 12;
    },
    convertTwentyFourHrsToAMPM(hour) {
      if (hour == 0) {
        return "12a";
      }
      if (hour == 12) {
        return "12p";
      }
      if (hour > 12) {
        return hour - 12 + "p";
      }
      return hour + "a";
    },
    /**
     * Converts an availability to another timezone offset from America/New_York.
     *
     * @param {availability} the object to convert
     * @param {offset} the user's time zone offset
     * @return the converted availability object
     */
    convertAvailability(availability, offset) {
      const succWeekday = {
        Sunday: "Monday",
        Monday: "Tuesday",
        Tuesday: "Wednesday",
        Wednesday: "Thursday",
        Thursday: "Friday",
        Friday: "Saturday",
        Saturday: "Sunday"
      };
      const predWeekday = {
        Sunday: "Saturday",
        Monday: "Sunday",
        Tuesday: "Monday",
        Wednesday: "Tuesday",
        Thursday: "Wednesday",
        Friday: "Thursday",
        Saturday: "Friday"
      };
      var convertedAvailability = {};
      for (const day in availability) {
        const times = availability[day];
        convertedAvailability[day] = {};
        for (const time in times) {
          convertedAvailability[day][time] = false;
        }
      }
      for (const day in availability) {
        const times = availability[day];
        for (const time in times) {
          if (availability[day][time] == true) {
            let newDay = day;
            let numericHour = this.convertAMPMtoTwentyFourHrs(time);
            let newHour = numericHour + offset;
            if (newHour >= 24) {
              newHour -= 24;
              newDay = succWeekday[day];
            } else if (newHour < 0) {
              newHour += 24;
              newDay = predWeekday[day];
            }
            convertedAvailability[newDay][
              this.convertTwentyFourHrsToAMPM(newHour)
            ] = true;
          }
        }
      }
      return convertedAvailability;
    },
    save() {
      this.saveState = saveStates.SAVING;
      const estUtcOffset = moment.tz.zone("America/New_York").parse(Date.now());
      const userUtcOffset = moment.tz.zone(this.selectedTz).parse(Date.now());
      // offsets returned by zone.utcOffset() are returned in minutes and inverted for POSIX compatibility
      const offset = (userUtcOffset - estUtcOffset) / 60;
      CalendarService.updateTimezone(this, this.user._id, this.selectedTz);
      CalendarService.updateAvailability(
        this,
        this.user._id,
        this.convertAvailability(this.availability, offset)
      ).then(response => {
        if (response.status == 200) {
          this.saveState = saveStates.SAVED;
        } else {
          this.saveState = saveStates.ERROR;
        }
      });

      // analytics: tracking whether a user has updated their availability
      AnalyticsService.trackNoProperties(
        "updated availability",
        this.user.isFakeUser
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.calendar-container {
  padding: 10px;

  @include breakpoint-above("medium") {
    padding: 40px;
  }
}

.calendar {
  background: #fff;
  border-radius: 8px;
  font-size: 12px;
  color: #343440;
  padding: 20px 15px;

  @include breakpoint-above("medium") {
    padding: 40px;
  }
}

.header {
  display: flex;
  margin: 0px;
  align-items: flex-start;
  justify-content: space-between;
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

.timeLabelContainer {
  padding-top: 47px;
}

.timeLabel {
  display: flex;
  justify-content: center;
  padding: 15px;
  height: 40px;
  width: 100px;
  border: 0.5px solid #cccccf;
}

.dayLabel {
  padding: 15px 0;
}

.dayTimeContainer {
  display: flex;
  padding: 20px 0 40px 0;
  justify-content: center;
}

.dayTime {
  display: flex;
}

.times {
  display: flex;
  flex-direction: column;
}

.timeOfDay {
  border: 0.5px solid #cccccf;
  height: 40px;
}

input[type="checkbox"] {
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

input[type="checkbox"]:checked + label {
  background-color: rgba(22, 210, 170, 0.5);
}

.tz-selector-container {
  padding-top: 30px;
}

@media screen and (max-width: 700px) {
  .btn {
    padding-top: 0em !important;
    padding-bottom: 0em !important;
  }
}
</style>
