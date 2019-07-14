<template>
<div v-if="calendar!={}">{{calendar}} </div>

</template>

<script>
import UserService from '../../services/UserService'
import NetworkService from '../../services/NetworkService'
export default{
    data () {
    
        
        return {
           calendar : {}
        }
        },
 
    created () {
        this.fetchData()
    },


    methods: {
    fetchData(){
        const calendar ={
        'Monday': new Array(24), 
        'Tuesday': new Array(24),
        'Wednesday': new Array(24),
        'Thursday': new Array(24),
        'Friday':new Array(24),
        'Saturday': new Array(24),
        'Sunday': new Array(24) }
        UserService.getAllUserAvailability(this, this.calendar).then(availability =>{
            for(const user in availability){ //iterating through users
                for (const day in availability[user]) { //iterating through days
                    for (const time in availability[user][day]) { //iterating through times
                        if (availability[user][day][time]) {
                            if(calendar[day][this.convertTimeToIndex(time)]){
                                calendar[day][this.convertTimeToIndex(time)]++
                            }
                            else{
                                calendar[day][this.convertTimeToIndex(time)] = 1
                            }
            }
        }   
        }
    }
        this.calendar = calendar
      return this.calendar
    })
    },
    convertTimeToIndex(time){
        let newTime 
        if (time=='12a'){
            newTime = 0}
        else if (time=='12p'){
            newTime = 12 }
        else if (time.slice(-1)=='p'){
            newTime = (time.slice(0,-1))+12 
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

</style>