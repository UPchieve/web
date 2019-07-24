<template>
<div class='volunteer-coverage'>
    <div class='header'>Volunteer Coverage </div>
        <div class='wrap-container'>

            <div class = 'container-metric'> 
                <div class='subheader-metric'># hours w/ less than 
                    <form>
                    <input v-model.number = 'lessThan' placeholder='number' class = 'input' type='number'
                    :style = "{'--rgb': lessThanColor}"> </form>
                    volunteers
                </div> 
                <div class = 'container-content'> 
                    <div class= 'metrics-info' >{{(100/168*getNumHours(true)).toFixed(2)}}%</div>
                    {{getNumHours(true)}}hrs 
                </div>
            </div>

            <div class = 'container-metric'> 
                <div class='subheader-metric'># hours w/ more than
                    <input v-model.number = 'greaterThan' placeholder='number' class = 'input' type='number'
                    :style = "{'--rgb': greaterThanColor}">
                    volunteers</div> 
                <div class = 'container-content'> 
                    <div class= 'metrics-info' >{{(100/168*getNumHours(false)).toFixed(2)}}% </div>
                    {{getNumHours(false)}}hrs
                </div>
            </div>

        <div class = 'container'>
            <div class='subheader-calendar'>Coverage Map</div>
                <div class = 'container-content'>
                    <div class = 'subject-selecter'>
                        <v-select v-model= 'selected' :options='topics' @input ='getAvailability'> </v-select>
                    </div>
                    <div class = 'grid'>
                        <div v-for='(cell, index) in availabilityTable'
                        :key = '`${index}`'>
                            <div v-bind:class = "[{'cell-header': typeof(cell) == 'string',
                            'cell-data': typeof(cell) != 'string'}]" 
                            :style = "{ '--rgb': getColor(cell), '--hour': getGradient(cell)}">
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

export default{
    data () {
        return {
            // colors for calendar heat map
            mainColor: '255, 0, 0', 
            lessThanColor: '255, 255, 0', // highlighting color for < metric 
            greaterThanColor: '0, 255, 0', // highlighting color for > metric
            lessAndGreaterThanColor: '255, 0, 255', // highlighting color for intersection between < and >
            errorMsg: '',
            // inputted values
            lessThan : '', 
            greaterThan: '',
            // dropdown menu options
            selected : 'algebra', // default
            topics: ['algebra', 'applications', 'biology', 'calculus', 'chemistry', 'esl', 'essays', 'geometry', 'planning', 'precalculus', 'trigonometry'],
            maxVolunteers : 0, // stores the max volunteers this week
            minVolunteers : 0, // stores the min volunteers this week
            /* 1D array that is a flattened 2D array that represents 
            the calendar. It is stored 1D for ease with css grid
            */
            availabilityTable: [] 
            }
        },
 
    created () {
       this.getAvailability(this.selected)
    },

    methods: {
        /* Retrieves a 2d array with column and row headers. Each cell represents
        the number of volunteers available at that day and hour block who are certified
        in the "certifiedSubject". */
        getAvailability (certifiedSubject) {
            UserService.getVolunteersAvailability(this, certifiedSubject).then(availability => {
               
                this.minVolunteers = availability.min // minimum # of volunteers available in any hour that week
                this.maxVolunteers = availability.max // maximum # of volunteers available in any hour that week
                this.availabilityTable = availability.table.flat()
                return this.availabilityTable
            }).catch(err => {
                this.errorMsg = err.message
            })
            },
       

        /* Helper function that finds the total number of hours where the number of 
        volunteers is less/greater than the inputted value. The boolean 
        lessThan represents if we are calculating for less than (true) or greater 
        than (false)*/
        getNumHours (lessThan) {
            let totalHours = 0
            if (this.availabilityTable && this.availabilityTable.length != 0){
                this.availabilityTable.forEach(currentValue => {
                    if (((typeof(currentValue) === 'number') && currentValue.length != 0) && 
                    ((lessThan && (this.lessThan.length !=0) && currentValue < this.lessThan) || 
                    (!lessThan && (this.greaterThan.length !=0) && currentValue > this.greaterThan))){
                        totalHours++ 
                    }    
                })
            }
            return totalHours
        },
        
        /**
         * Helper function that gets the color of the cell based on
         * whether there are numbers in the lessThan or greaterThan
         * boxes
         */
        getColor (cell) {
            //lessThan and greaterThan have an intersection
            if ((this.greaterThan.length!=0) && cell > this.greaterThan && 
            (this.lessThan.length!=0) && cell < this.lessThan){
                return this.lessAndGreaterThanColor
            }
            else if ((this.lessThan.length!=0) && cell < this.lessThan){
                return this.lessThanColor
            }
            else if ((this.greaterThan.length!=0) && cell > this.greaterThan){
                return this.greaterThanColor
            }
            else {
                return this.mainColor
            }
        },

        /**
         * Helper function to convert table cell values into a percentage
         * that determines the opacity of the cell color. Does this by converting
         * the range between max # of volunteers and min # of volunteers in a week
         * into a range that is 20-70 (only want 20-70 because dont ever want 
         * 0% or 100% opacity)
         */
        getGradient (cell) {
            return (100-(((cell-this.minVolunteers)/(this.maxVolunteers - this.minVolunteers)) * (70) + 20) + '%')
        },
    }
}
    
</script>

<style lang="scss" scoped>

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

.wrap-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.container {
    display: flex;
    flex-direction: column;
    margin: 1vw;
     &-metric {
        @extend .container;
        width: 170px;
    }
}

.subheader {
  font-weight: 600;
  justify-content: center;
  align-items: center;
  background-color: #e3f2fd;
  font-size: 20px;
  padding: 10px;
    &-metric{
      @extend .subheader;
      height: 150px;
  }
    &-calendar{
      @extend .subheader;
      height: 50px;
  }
}

.input {
    background-color: white;
    width: 100px;
    font-size: 15px;
    text-align: center;
    border-left-width: 10px;
    border-left-color: rgba(var(--rgb), .5);
}

.container-content {
  background-color: #f0f8fd;
  padding: 1vw;
}

.metrics-info {
    font-size: 40px;
}

.subject-selecter {
  background-color: white;
}

.grid{
    display: grid;
    margin: 20px;
    grid-auto-flow: column;
    grid-template-columns: 30px repeat(7, 1fr);
    grid-template-rows: repeat(25, 1fr);
    grid-gap: 2px;

}

.cell {
  color: gray;
    &-header {
        @extend .cell;
        font: bold;
        overflow: hidden;
    }
    &-data {
        @extend .cell;
        background-color: rgba(var(--rgb), (var(--hour)));
    }
}

</style>