<template>
<div class="volunteer-coverage">
    <div class="header">Volunteer Coverage </div>
        <div class="wrap-container">

            <div class = "container--metric"> 
                <div class="subheader--metric"># hours w/ less than 
                    <input v-model = "lessThan" placeholder="number" class = "input">
                    volunteers
                </div> 
                <div class = "container-content"> 
                    <div class= "metrics-info" >{{getNumHours(true)}} </div>
                </div>
            </div>

            <div class = "container--metric"> 
                <div class="subheader--metric"># hours w/ more than
                    <input v-model = "greaterThan" placeholder="number" class = "input">
                    volunteers</div> 
                <div class = "container-content"> 
                    <div class= "metrics-info" >{{getNumHours(false)}} </div>
                </div>
            </div>

        <div class = "container">
            <div class="subheader--calendar">Coverage Map</div>
                <div class = "container-content">
                    <div class = "subject-selecter">
                        <v-select v-model= "selected" :options="topics" @input ="getAvailability"> </v-select>
                    </div>
                    <div class = "grid">
                        <div v-for="(cell, index) in availabilityTable"
                        :key = "`${index}`">
                            <div v-bind:class = "[{'cell--header': typeof(cell) == 'string',
                            'cell--data': typeof(cell) != 'string'}]" 
                            :style = " { '--rgb': getColor(cell), '--hour': getGradient(cell)}">
                                {{cell}}
                            </div>
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
            msg: '',
            lessThan : null,
            greaterThan: null,
            topics: ['algebra', 'applications', 'biology', 'calculus', 'chemistry', 'esl', 'essays', 'geometry', 'planning', 'precalculus', 'trigonometry'],
            selected : 'algebra',
            maxVolunteers : 0, //stores the max volunteers this week
            minVolunteers : 0, //stores the min volunteers this week
            availabilityTable: []
            }
        },
 
    created () {
       this.getAvailability(this.selected)
    },

    methods: {
        getNumHours(lessThan){
            let compareWith = null
            if(lessThan){
                 compareWith = this.lessThan
            }
            else{ 
                compareWith = this.greaterThan
            }
            let totalHours = 0
            if(this.availabilityTable && this.availabilityTable.length != 0){
                this.availabilityTable.forEach(currentValue => {
                    if(compareWith && (typeof(currentValue)=== 'number')){
                       if(this.lessThan && currentValue < compareWith ||
                        this.greaterThan && currentValue > compareWith){
                            totalHours++ 
                        }
                    } 
                })
            }
            return totalHours
        },

        getColor(cell) {
            if(this.greaterThan && cell > this.greaterThan && 
            this.lessThan && cell < this.lessThan){
                return '255, 0, 255'
            }
            else if(this.lessThan && cell < this.lessThan){
                return '255, 255, 0'
            }
            else if(this.greaterThan && cell > this.greaterThan){
                return '0, 255, 0'
            }
            else{
                return '255, 0, 0'
            }
        },
        getGradient(cell){
            let gradient = ((cell/(this.maxVolunteers - this.minVolunteers)) * (70) + 20) + '%'
            return gradient
        },

    getAvailability(certifiedSubject){
        UserService.getVolunteersAvailability(this, certifiedSubject).then(availability =>{
            this.minVolunteers = availability.min
            this.maxVolunteers = availability.max
            this.availabilityTable = availability.table.flat()
            return this.availabilityTable
        }).catch(err => {
          this.msg = err.message
        })
        },
    }
}
    
</script>

<style lang="scss" scoped>

.wrap-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}
.container {
    display: flex;
    flex-direction: column;
    margin: 1vw;
     &--metric {
        @extend .container;
        width: 170px;
    }
}

.grid{
    display: grid;
    margin: 20px;
    grid-auto-flow: column;
    grid-template-columns: 30px repeat(7, 1fr);
    grid-template-rows: repeat(25, 1fr);
    grid-gap: 2px;

}
.metrics-info {
    font-size: 40px;
}

.cell {
  color: gray;
    &--header {
        @extend .cell;
        font: bold;
        overflow: hidden;
    }
    &--data {
        @extend .cell;
        background-color: rgba(var(--rgb), (var(--hour)));
    }
}

.input {
    width: 100px;
    font-size: 15px;
    text-align: center;
}

.subheader {
  font-weight: 600;
  justify-content: center;
  align-items: center;
  background-color: #e3f2fd;
  font-size: 20px;
  padding: 10px;
    &--metric{
      @extend .subheader;
      height: 150px;
  }
    &--calendar{
      @extend .subheader;
      height: 50px;
  }
    &--input {
  background-color: #e3f2fd;
  }
}

.container-content {
  background-color: #f0f8fd;
  padding: 1vw;
}

.subject-selecter {
  background-color: white;
}

.header{
  display: flex;
  padding: 30px;
  margin: 0;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;;
}

</style>