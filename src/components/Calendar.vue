<template>
<div class="calendar">
<div class="dayTime">
  <div class="timeLabel">
    <div v-for="time in timeRange">
      {{ time }}
    </div>
  </div>
  <form class="days">
    <div v-for="(dayValue, day) in availability">
      {{ day }}
      <div class="times">
        <div v-for="sortedTime in sortedTimes[day]" class="timeOfDay">
          <input type="checkbox" id=time v-model=availability[day][sortedTime]>
          <label for=sortedTime>{{ sortedTime }}: {{ availability[day][sortedTime] }}</label>
        </div>
      </div>
    </div>
  </form>
</div>
<button @click="save()">Save</button>
</div>
</template>

<script>

import CalendarService from '../services/CalendarService';
import UserService from 'src/services/UserService';

export default {
  data(){
    let user = UserService.getUser();
    let timeRange = ['12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a',
      '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p',
      '10p', '11p'];
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

input[type='checkbox'] {
  position: fixed;
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
  background-color: #EEEEEE;
}

.dayTime {
  display: flex;
}

.days {
  display: flex;
}

.times {
  display: flex;
  flex-direction: column-reverse;
}

.timeOfDay {
  border: 1px solid #000;
}

</style>
