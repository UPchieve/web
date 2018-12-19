<template>
  <div class="calendar">
    <h1 class="header">
      <div class="header-title">Schedule</div>
      <button
        class="btn"
        @click="save()">Update Schedule</button>
    </h1>
    <div class="dayTimeContainer">
      <div class="timeLabelContainer">
        <div
          v-for="time in timeRange"
          :key="time"
          class="timeLabel">
          {{ time }}
        </div>
      </div>
      <form class="dayTime">
        <div
          v-for="(dayValue, day) in availability"
          :key="`day-${day}`">
          <div class="dayLabel">{{ day }}</div>
          <div class="times">
            <div
              v-for="sortedTime in sortedTimes[day]"
              :key="sortedTime"
              class="timeOfDay">
              <input
                id="time"
                v-model="availability[day][sortedTime]"
                type="checkbox">
              <label for="sortedTime"/>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>

import UserService from 'src/services/UserService';
import CalendarService from '../services/CalendarService';

export default {
  data() {
    const user = UserService.getUser();
    const timeRange = ['12 am', '1 am', '2 am', '3 am', '4 am', '5 am', '6 am', '7 am', '8 am', '9 am',
      '10 am', '11 am', '12 pm', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm', '9 pm',
      '10 pm', '11 pm'];
    return {
      user,
      availability: {},
      timeRange,
    };
  },
  computed: {
    sortedTimes() {
      return this.sortTimes();
    },
  },
  beforeMount() {
    if (!this.user.hasSchedule) {
      CalendarService.initAvailability(this, this.user._id);
    }
    CalendarService.getAvailability(this, this.user._id).then((availability) => {
      this.availability = availability;
    });
  },
  methods: {
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
          if (keys[0] !== '12a') {
            keys.reverse();
          }
          keysMap[day] = keys;
        }
      }
      return keysMap;
    },
    save() {
      console.log(this.availability);
      CalendarService.updateAvailability(this, this.user._id, this.availability);
    },
  },
};

</script>

<style scoped>

.calendar {
  font-size: 12px;
  color: ##343440;
}

.header {
  display: flex;
  padding: 30px 0 30px 50px;
  margin: 0px;
  font-size: 24px;
  border-bottom: 0.5px solid #CCCCCF;
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
  border: 0.5px solid #CCCCCF;
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
  border: 0.5px solid #CCCCCF;
  height: 40px;
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

.btn {
  font-size: 20px;
  font-weight: 600;
  color: #16D2AA;
  padding-right: 40px;
}

</style>
