<template>
  <div>
  <template v-if="!user.isVolunteerApproved">
    <div>
      <h3>You need to be approved! In order to be approved, you need to do the following:</h3>
      <div id="checkbox-container" class="checklist">
        <div>
          <input type="checkbox" id="identity" value="identity" @click="save()">
          <label for="identity" >Proof of identity</label>
        </div>
        <div>
          <input type="checkbox" id="education" value="education" @click="save()">
          <label for="education">Proof of education</label>
        </div>
        <div>
          <input type="checkbox" id="references" value="references" @click="save()">
          <label for="references">Provide at least 2 references</label>
        </div>
        <div>
          <input type="checkbox" id="legal" value="legal" @click="save()">
          <label for="legal">Sign the legal agreement</label> 
        </div>
        <div>
          <input type="checkbox" id="schedule" value="schedule" @click="save()">
          <label for="callmark">Schedule a call with Mark</label>
        </div>
      </div>
    </div>
  </template>
  <template v-else-if="user.isVolunteerApproved && !user.isVolunteerReady">
    <h3>You are approved! The next steps you need to take are:</h3>
    <div class="checklist">
      <div v-if="!user.hasAvailability">
        Schedule at least 1 hour of availability
      </div>
      <div v-if="!user.hasCertification">
        Get certified in at least 1 subject
      </div>
    </div>
  </template>
  </div>
</template>

<script>

import UserService from '@/services/UserService'

export default {
  data () {
    const user = UserService.getUser() || {}
    var checklist = ['identity','education','references','legal','schedule']

    return {
      user,
      checklist
    }
  },
  mounted () {
    for (var i = 0; i < this.checklist.length; i++) {
      var checked = JSON.parse(localStorage.getItem(this.checklist[i]))
      document.getElementById(this.checklist[i]).checked = checked
    }
  },

  methods: {
    save () {
      for (var i = 0; i < this.checklist.length; i++) {
        var checkbox = document.getElementById(this.checklist[i])
        localStorage.setItem(this.checklist[i], checkbox.checked)
      }
    },
  }  
}

</script>

<style lang="scss" scoped>

.checklist {
  padding: 20px 25px;
  font-size: 16px;
  text-align: left;
}

#checkbox-container{
  margin: 10px 5px;
  text-align: left;
  padding: 25px;
}

#checkbox-container div{
  margin-bottom: 5px;
}

#checkbox-container button{
  margin-top: 5px;
}

input[type=text] {
  padding: .5em .6em;
  display: inline-block;
  border: 1px solid #ccc;
  box-shadow: inset 0 1px 3px #ddd;
  border-radius: 4px;
}

h3 {
  padding: 0px 25px;
}
</style>
