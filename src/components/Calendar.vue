<template>
<div class="calendar">
<form class="days">
  <div v-for="(dayValue, day) in availability">
    {{ day }}
    <div class="times" v-bind:style="orderTimes">
      <div v-for="(timeValue, time, index) in dayValue" class="time" v-bind:id="time + '-' + index + '-' + day">
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
    return {
      user: user,
      availability: {},
      orderTimes: {}
    }
  },
  beforeMount() {
    this.initialize();
  },
  mounted: function(){
    var id = '12a-0-Sunday';
    var element = document.getElementById(id);
    console.log(element);
    if (!element) {
      console.log('orderTimes is column reverse');
      this.orderTimes = {
        display: 'flex',
        flexDirection: 'column-reverse'
      };
    } else {
      console.log('orderTimes is column');
      this.orderTimes = {
        display: 'flex',
        flexDirection: 'column'
      };
    }
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

</style>
