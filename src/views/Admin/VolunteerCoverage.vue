<template>
<div>
   <v-select v-model= "selected" :options="topics" @input ="calendarToArray"> </v-select> 
   
<div class = "calendar">
    <div v-for="(day, index2) in availabilityTable"
       :key = "`${index2}`">
        <div v-for="(hour, index3) in day"
            :key = "`${index3}`"> 
                <div v-if="(index2 = 0)|| (index3 = 0)">
                        {{hour}}
                </div>
                <div v-else>
                    <div class = 'hour' :style = "{'--hour': getGradient(hour)}">
                        {{hour}}
                    </div>
                </div>
       </div>
    </div>
    </div>
    <div v-if="msg !== ''">{{ msg }}</div>
</div>



        </template>

<script>
import UserService from '@/services/UserService'
import NetworkService from '@/services/NetworkService'


export default{
    data () {

        return {
            msg: '',
            topics: ['algebra', 'applications', 'biology', 'calculus', 'chemistry', 'esl', 'essays', 'geometry', 'planning', 'precalculus', 'trigonometry'],
            selected : 'algebra',
            maxVolunteers : 0, //stores the max volunteers this week
            minVolunteers : 0, //stores the min volunteers this week
            availabilityTable: []
            }
        },
 
    created () {
       this.calendarToArray(this.selected)
    },

    methods: {
        getGradient(hour){
            let gradient = ((hour/(this.maxVolunteers - this.minVolunteers)) * (70) + 20) + '%'
            return gradient
        },

    calendarToArray(certifiedSubject){
        this.maxVolunteers = 0
        this.minVolunteers = 0
        UserService.getVolunteersAvailability(this, certifiedSubject).then(availability =>{
            this.minVolunteers = availability.min
            this.maxVolunteers = availability.max
            this.availabilityTable = availability.table
            return this.availabilityTable
        }).catch(err => {
          this.msg = err.message
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