<template>
<div>
   <v-select v-model= "selected" :options="topics" @input ="calendarToArray"> </v-select> 
   
<div class = "calendar">
    <div v-for="(day, index2) in calendar"
       :key = "`${index2}`">
        <div v-for="(hour, index3) in day"
            :key = "`${index3}`"> 
                <div v-if="(index2 = 0)|| (index3 = 0)">
                    <div class = "header">
                        console.log({{hour}})
                        {{hour}}
                        </div>
                </div>
                <div v-else>
                    <div class = 'hour' :style = "{'--hour': getGradient(hour)}">
                        {{hour}}
                    </div>
                </div>
       </div>
    </div>
    </div>
</div>


        </template>

<script>
import UserService from '@/services/UserService'
import NetworkService from '@/services/NetworkService'


export default{
    data () {

        return {
            topics: ['algebra', 'applications', 'biology', 'calculus', 'chemistry', 'esl', 'essays', 'geometry', 'planning', 'precalculus', 'trigonometry'],
            selected : 'algebra',
            degs: '50%',
            times: [],
            daysOfWeek: [],
            calendar: [],
            maxVolunteers : 0, //tracks the max volunteers this week
            minVolunteers : 0
            }
        },
 
    created () {
       this.calendarToArray(this.selected)
        //this.getUsers()
    },

    methods: {
        getGradient(hour){
            let gradient = ((hour/(this.maxVolunteers - this.minVolunteers)) * (70) + 20) + '%'
            return gradient
        },

    calendarToArray(certifiedSubject){
        console.log(certifiedSubject)
        const calendar = Array(8).fill(0).map(()=>Array(25).fill(0));
        UserService.getVolunteersAvailability(this, certifiedSubject).then(availability =>{
            this.volunteers = Object.keys(availability)
            for(const user in availability){ //iterating through users
                for (const day in availability[user]) { //iterating through days
                    this.daysOfWeek = Object.keys(availability[user])
                    this.times = Object.keys(availability[user][day])
                    for (const time in availability[user][day]) { //iterating through times
                        let dayIndex = this.daysOfWeek.indexOf(day)+1
                        let timeIndex = this.convertTimeToIndex(time)+1
                         calendar[dayIndex][0] = day
                         calendar[0][timeIndex] = time
                        if (availability[user][day][time]) {
                                calendar[dayIndex][timeIndex]++
                                if(calendar[dayIndex][timeIndex] > this.maxVolunteers){
                                    this.maxVolunteers = calendar[dayIndex][timeIndex]
                                }
                                else if(calendar[dayIndex][timeIndex] < this.minVolunteers){
                                    this.minVolunteers  = calendar[dayIndex][timeIndex]
                                }
                        }
                    } 
                }
            }
        calendar[0][0] = '----'
        this.calendar = calendar
        })
    },
 
    convertTimeToIndex(time){ //USE CALENDAR SERVICE 24 HOUR TIME
        let newTime 
        if (time=='12a'){
            newTime = 0}
        else if (time=='12p'){
            newTime = 12 }
        else if (time.slice(-1)=='p'){
            newTime = parseInt(time.slice(0,-1))+12 
        }
        else{
        newTime = (time.slice(0,-1))
        }
        return parseInt(newTime, 10)
        }
    }
}
    
</script>

<style lang="scss" scoped>
:root, [data-theme="default"] {
    --test: ".3";
}
.calendar{
    display: grid;
    max-width: 560px;
  margin: 20px auto;
  grid-template-columns: repeat(8, auto);
}
.header{
    grid-area: header;
}
.day{
    display: flex;
    justify-content: space-evenly;
}
.hour{
    flex-grow: 1;
    flex-shrink: 1;
    flex-basis: 0;
}
.hour {
  background-color: hsl(0, 100%, var(--hour));
  color: gray;
  padding: 5px;
  box-shadow: 
    -1px -1px gray, 
    inset -1px -1px 0 0 gray;
}

.test {
    background: hsla(120, 30%, 20%, var(--degs));
}

.choose {
    text-align: center;
}

</style>