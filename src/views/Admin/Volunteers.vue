<template>
  <div v-if="user.isAdmin">
    <div class="header">
      Volunteers
    </div>
    <div class="wrapper">
      <table>
        <thead>
          <tr>
            <th v-for="key in volunteerProperties" v-bind:key="key.index">
              <div v-if="key === 'firstname' || key === 'lastname' || key === '_id'">
                <label>Search</label>
                <input
                  type="text"
                  v-model="appliedFilter[key]"
                  :placeholder="key"
                />
              </div>
              <div v-else-if="key === 'numberOfHours'">
                <label>less than</label>
                <input
                  type="text"
                  class="hoursInput"
                  v-model="appliedFilter[key]"
                  :placeholder="'#'"
                />
                <label>hour(s)</label>
              </div>
              <div v-else-if="key != 'Status'">
                <label>{{key}}</label>
                <select v-model="appliedFilter[key]">
                  <option></option>
                  <option>True</option>
                  <option>False</option>
                </select>
              </div>
              <div v-else>
                <label>{{key}}</label>
              </div>
            </th>
            
          </tr>
        </thead>
        <tbody>
          <tr v-for="volunteer in filteredItems" v-bind:key="volunteer._id">
            <td v-for="key in volunteerProperties" v-bind:key="key.index">
              <div v-if="key === '_id'">
                <router-link
                  :to="{
                    name: 'VolunteerProfile',
                    params: {id: volunteer._id}}">
                  {{volunteer._id}}
                </router-link>
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
              <div v-else>
                {{ volunteer[key] }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
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
    const user = UserService.getUser()

    var volunteerProperties = ['firstname','lastname', '_id',
      'isVolunteerApproved', 'hasCertification', 'numberOfHours', 'Status']
    
    return {
      user,
      search: '',
      volunteers: [],
      volunteerProperties,
      appliedFilter: {},
    }
  },
  computed: {
    filteredItems() {
      var resultItems = this.volunteers
      if (this.appliedFilter) {
        for (const field in this.appliedFilter) {
          const val = this.appliedFilter[field].toLowerCase()
          if (val) {
            resultItems = resultItems.filter(volunteer => {
              var result = volunteer[field]
              var hours = Infinity
              if (typeof volunteer[field] === 'boolean') {
                result = volunteer[field].toString()
              }
              else if (typeof volunteer[field] === 'number') {
                hours = Number(this.appliedFilter[field])
                return (volunteer[field] < hours)
              }
              return result.toLowerCase().includes(val)
            })
          }
        }
      }
      return resultItems
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
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

th, td {
  min-width: 120px;
  padding: 10px 0px;
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
  margin-bottom: 30px;
}

input[type="text"] {
  display: block;
  margin : 0 auto;
  margin-bottom: 5px;
  color: #73737a;
  border: none;
  box-shadow: none;
  border-radius: 0;
  background-color: white;
  width: 90%;
}

input::placeholder {
  color: lightgrey;
  text-align: center;
}

input[class="hoursInput"] {
  width: 25%;
}

select {
  display: block;
  margin : 0 auto;
  margin-bottom: 5px;
  color: #73737a;
  background: white;
}

label {
  display: block;
  margin : 0 auto;
  text-align: center;
  padding: 5px;
}
</style>