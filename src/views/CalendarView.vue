<template>
  <div class="calendar">
    <h1 class="header">
      <div class="header-title">Schedule</div>
    </h1>
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
                  id="time"
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
</template>

<script>
import _ from "lodash";
import moment from "moment-timezone";
import UserService from "@/services/UserService";
import CalendarService from "@/services/CalendarService";

export default {
  data() {
    const user = UserService.getUser();
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
      user,
      availability: {},
      timeRange,
      tzList: moment.tz.names(),
      selectedTz: ""
    };
  },
  beforeRouteLeave (to, from, next) {
    // called when the route that renders this component is about to
    // be navigated away from.
    this.save()
    next()
  },
  computed: {
    sortedTimes() {
      return this.sortTimes();
    },
    hasUserSchedule() {
      return !_.isEmpty(this.availability);
    }
  },
  created() {
    this.fetchData();
  },
  methods: {
    fetchData() {
      if (!this.user.hasSchedule) {
        CalendarService.initAvailability(this, this.user._id);
      }

      var originalAvailabilityPromise = CalendarService.getAvailability(
        this,
        this.user._id
      );
      var userTimezonePromise = CalendarService.getTimezone(
        this,
        this.user._id
      );

      Promise.all([originalAvailabilityPromise, userTimezonePromise]).then(
        ([originalAvailability, userTimezone]) => {
          if (userTimezone && this.userTzInList(userTimezone)) {
            this.selectedTz = userTimezone;
          } else {
            this.selectedTz = moment.tz.guess();
          }

          var estNow = moment.tz("America/New_York").hour();
          var userNow = moment.tz(this.selectedTz).hour();
          var offset = userNow - estNow;
          this.availability = this.convertAvailability(
            originalAvailability,
            offset
          );
        }
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
      var hr = hour.substring(0, hour.length - 1);
      var apm = hour.substring(hour.length - 1);
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
      var estNow = moment.tz("America/New_York").hour();
      var userNow = moment.tz(this.selectedTz).hour();
      var offset = estNow - userNow;
      CalendarService.updateTimezone(this, this.user._id, this.selectedTz);
      CalendarService.updateAvailability(
        this,
        this.user._id,
        this.convertAvailability(this.availability, offset)
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.calendar {
  font-size: 12px;
  color: #343440;
}

.header {
  display: flex;
  padding: 30px 0 30px 50px;
  margin: 0px;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}

.header-title {
  font-weight: 600;
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

.btn {
  font-size: 20px;
  font-weight: 600;
  color: #16d2aa;
  padding-right: 40px;
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
