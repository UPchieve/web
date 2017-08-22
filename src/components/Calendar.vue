<template>
<div class="calendar">
<form class="days">
  <div v-for="(dayValue, day) in availability">
    {{ day }}
    <div class="times">
      <div v-for="(timeValue, time) in dayValue">
        <input type="checkbox" id=time v-model=availability[day][time]>
        <label for=time>{{ time }}: {{ timeValue }}</label>
      </div>
    </div>
  </div>
</form>
<button @click="save()">Save</button>
</div>
</template>

<script>

import CalendarService from '../services/CalendarService';
import UserService from 'src/services/UserService';

export default {
  data(){
    let user = UserService.getUser();
    let availability = {};
    return {
      user: user,
      availability: availability
    }
  },
  beforeMount() {
    this.initialize();
  },
  methods: {
    initialize(){
      CalendarService.initAvailability(this, this.user._id);
      CalendarService.getAvailability(this, this.user._id).then((availability) => {
        this.availability = availability;
      });
    },
    display(){
      for (var day in this.availability) {
        if (this.availability.hasOwnProperty(day)) {
          console.log(day);
          var times = this.availability[day];
          for (var time in times) {
            if (times.hasOwnProperty(time)) {
              console.log(time);
              var selected = times[time];
              console.log(selected);
            }
          }
        }
      }
    },
    save(){
      console.log(this.availability);
      CalendarService.updateAvailability(this, this.user._id, this.availability);
    }
  }
}

</script>

<style scoped>

.days {
  display: flex;
}

.times {
  display: flex;
  flex-direction: column-reverse;
}

</style>
