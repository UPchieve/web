<template>
  <div class="profile">
    <div class="header">
      {{volunteer.firstname}}'s Profile
      <button
      class="editBtn btn"
      @click="editApproval(volunteer)">
      {{ editBtnMsg }}
      </button>
    </div>
    <div class = "wrap-container">
      <div class="contain">
      <div class="subheader">Personal Information</div>
      <div class="container-content">
      
      <!-- <table>
        <tbody>
            <td v-for="key in volunteerProperties" v-bind:key="key.index">
              <div v-if="key === 'isVolunteerApproved'">
                <div v-show="!activeEdit" class="answer">
                  {{ volunteer.isVolunteerApproved }}
                </div>
                <input
                  v-show="activeEdit"
                  v-model="volunteer.isVolunteerApproved"
                  type="text"
                  class="form-control"
                  id="edit"
                  @keypress="edited()"
                />
              </div>
              <div v-else-if="key === 'Approved and Ready'">
                {{ volunteer.isVolunteerApproved && volunteer.isVolunteerReady }}
              </div>
              <div v-else-if="key !== 'isVolunteerApproved'">
                {{ volunteer[key] }}
              </div>
            </td>
        </tbody>
      </table> -->
    </div>
      </div>
  </div>
  </div>
</template>

<script>
import UserService from '@/services/UserService'
import axios from 'axios'

export default {
  data () {
    const volunteerProperties = ['firstname', 'lastname', 'isVolunteerApproved', 'hasAvailability', 'hasCertification', 'isVolunteerReady', 'Approved and Ready']
    return {
      msg: '',
      volunteer: {},
      volunteerProperties,
      activeEdit: false,
      editBtnMsg: 'Edit',
      errors: [],
      saveFailed: false,
      loading: false
    }
  },
  
  created () {
    var id = this.$route.params.id
    UserService.getVolunteer(this, id).then(volunteer =>{
      this.volunteer = volunteer
      })
  },

  methods: {
        /**
     * Toggle editing state.
     * {Case A} if activeEdit === false: enter the editing state by setting activeEdit to true
     * {Case B} if activeEdit === true: save profile changes & exit the editing state by setting activeEdit to false
     */
    editApproval (user) {
      // {Case A} Enter the editing state, then early exit
      if (!this.activeEdit) {
        this.editBtnMsg = 'Save'
        this.activeEdit = true
        return
      }
      // {Case B} The remainder of this function saves new changes and exits the editing state

      // Start by erasing previous errors
      this.saveFailed = false

      // form fields valid, so set profile
      // wait for save to succeed before coming out of edit mode
      UserService.editVolunteer(this, user)
      .then(res => {
        this.editBtnMsg = 'Edit'
        this.activeEdit = false
        this.saveFailed = false
        return
      }).catch(err => {
        this.msg = err.message
      })
    
    },
    
    edited() {
      var x = document.getElementById("edit");
      x.style.backgroundColor = "yellow";
    },
  }
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
  font-size: 20px;
  font-weight: 600;
  color: #343440;
  background-color: #fff;
}

.editBtn:active,
.editBtn:hover {
  background-color: #fff;
  color: #16d2aa;
  box-shadow: none;
  margin: 0px;
}

.editBtn a {
  color: white;
}

.editBtn a:hover {
  color: #2c3e50;
  text-decoration: none;
}
.wrap-container {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
}

.contain {
  margin: 30px 0 0 30px;
  width: 475px;
}

.container-content {
  display: flex;
  background-color: #f0f8fd;
  padding: 30px;
  text-align: left;
}

.subheader {
  font-weight: 600;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 80px;
  background-color: #e3f2fd;
  font-size: 20px;
}

</style>