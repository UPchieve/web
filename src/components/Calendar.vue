<template>
<div class="calendar">
<h1 class="header">Schedule</h1>
<div class="dayTimeContainer">
  <div class="timeLabelContainer">
    <div v-for="time in timeRange" class="timeLabel">
      {{ time }}
    </div>
  </div>
  <form class="dayTime">
    <div v-for="(dayValue, day) in availability">
      <div class="dayLabel">{{ day }}</div>
      <div class="times">
        <div v-for="sortedTime in sortedTimes[day]" class="timeOfDay">
          <input type="checkbox" id=time v-model=availability[day][sortedTime]>
          <label for=sortedTime></label>
        </div>
      </div>
    </div>
  </form>
</div>
<button @click="save()" class="btn">Save</button>
</div>
</template>

<script>

import CalendarService from '../services/CalendarService';
import UserService from 'src/services/UserService';

export default {
  data(){
    let user = UserService.getUser();
    let timeRange = ['12 am', '1 am', '2 am', '3 am', '4 am', '5 am', '6 am', '7 am', '8 am', '9 am',
      '10 am', '11 am', '12 pm', '1 pm', '2 pm', '3 pm', '4 pm', '5 pm', '6 pm', '7 pm', '8 pm', '9 pm',
      '10 pm', '11 pm'];
    return {
      user: user,
      availability: {},
      timeRange: timeRange
    }
  },
  computed: {
    sortedTimes: function () {
      return this.sortTimes();
    }
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
    sortTimes(){
      var keysMap = new Object();
      for (var day in this.availability) {
        if (this.availability.hasOwnProperty(day)) {
          var times = this.availability[day];
          var keys = [];
          for (var time in times) {
            if (times.hasOwnProperty(time)) {
              keys.push(time);
            }
          }
          if (keys[0] != '12a') {
            keys.reverse();
          }
          keysMap[day] = keys;
        }
      }
      return keysMap;
    },
    save(){
      console.log(this.availability);
      CalendarService.updateAvailability(this, this.user._id, this.availability);
    }
  }
}

</script>

<style scoped>

.calendar {
  font-size: 16px;
}

.header {
  display: flex;
  padding: 30px 0 30px 50px;
  margin: 0px;
  font-size: 24px;
  border-bottom: 1px solid #000;
}

.timeLabelContainer {
  padding-top: 50px;
}

.timeLabel {
  display: flex;
  justify-content: center;
  padding: 15px;
  height: 52px;
}

.dayLabel {
  padding: 15px 0;
}

.dayTimeContainer {
  display: flex;
}

.dayTime {
  display: flex;
}

.times {
  display: flex;
  flex-direction: column-reverse;
}

.timeOfDay {
  border: 1px solid #000;
  height: 52px;
}

input[type='checkbox'] {
  position: absolute;
  display: block;
  opacity: 0;
  width: 100px;
  height: 50px;
}

label {
  width: 100px;
  height: 50px;
  margin: 0;
}

input[type='checkbox']:checked + label {
  background-color: #16D2AA;
}

.btn {
  margin: 50px 0px;
  font-size: 16px;
}

</style>
