<template>
  <div class="profile">
    <div class="header">
      Volunteers
    </div>
    <div>
      <table>
        <thead>
          <tr>
            <th v-for="key in volunteerProperties" v-bind:key="key.index">
              {{ key }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="volunteer in volunteers" v-bind:key="volunteer._id">
            <td v-for="key in volunteerProperties" v-bind:key="key.index">
              <div v-if="key === '_id'">
                <router-link :to="{ name: 'VolunteerProfile', params: {id: volunteer._id}}">{{volunteer._id}} </router-link>
                </div>
              <div v-if="key === 'isVolunteerApproved'">
                <div v-show="!activeEdit" class="answer">
                  {{ volunteer.isVolunteerApproved }}
                </div>
              </div>
              <div v-else-if="key === 'Status'">
                <div v-if="volunteer.isVolunteerApproved && volunteer.isVolunteerReady">
                  Approved and Ready!
                </div>
                <div v-else-if="volunteer.isVolunteerApproved && !volunteer.isVolunteerReady">
                  Approved
                </div>
                <div v-else-if="!volunteer.isVolunteerApproved && !volunteer.isVolunteerReady">
                  Hasn't Started
                </div>
                <div v-else>
                  Ready
                </div>
              </div>
              <div v-else-if="key !== 'isVolunteerApproved' && key !== '_id'">
                {{ volunteer[key] }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="msg !== ''">{{ msg }}</div>
  </div>
</template>

<script>
import UserService from '@/services/UserService'
import VolunteerProfile from './VolunteerProfile'

export default {
  components: {
    VolunteerProfile
  },
  data () {
    var volunteerProperties = ['firstname', 'lastname', '_id', 'Status']

    // var volunteerProperties = ['firstname', 'lastname', '_id', 'isVolunteerApproved', 'hasAvailability', 'hasCertification', 'isVolunteerReady', 'Approved and Ready']
    
    return {
      msg: '',
      volunteers: {},
      volunteerProperties,
      activeEdit: false,
      editBtnMsg: 'Edit',
      errors: [],
      saveFailed: false
    }
  },

  created () {
    UserService.getVolunteers(this).then(volunteers =>{
      this.volunteers = volunteers
      })
  },

}
</script>

<style lang="scss" scoped>
body {
  font-family: "Work Sans", Helvetica, Arial, sans-serif;
  font-size: 14px;
}

table {
  border: 2px solid #16d2aa;
  border-radius: 3px;
  background-color: white;
}

th {
  background-color: #16d2aa;
  color: white;
  cursor: pointer;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

th, td {
  min-width: 120px;
  padding: 10px 20px;
}

.header {
  display: flex;
  padding: 30px;
  margin: 0;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}

.form-control {
  border: none;
  box-shadow: none;
  border-radius: 0;
  // background-color: #f0f8fd;
  width: 60px;
  height: 30px;
}

.form-control:focus {
  border-bottom: 3px solid #16d2aa;
  box-shadow: none;
}

input[type="text"] {
  display: block;
  margin : 0 auto;
  margin-bottom: 5px;
}

button {
  height: 30px;
  border-radius: 20px;
  padding: 0px 10px;
  color: #16d2aa;
  background-color: #f17777;
}

.editBtn {
  background-color: #16d2aa;
  border-radius: 30px;
  width: 20;
  align-items: center;
  height: 20px;
  justify-content: center;
  font-size: 10px;
  font-weight: 500;
  color: #2c3e50;
}

.editBtn a {
  color: white;
}

.editBtn a:hover {
  color: #2c3e50;
  text-decoration: none;
}
</style>