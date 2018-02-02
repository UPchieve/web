<template>
 <div class="profile-info">
   <div class="avatar" v-bind:style="avatarStyle"></div>
   <template>
     <p class="greeting" v-if="$route.path.indexOf('/onboarding') !== -1 && !user.isVolunteer">
       Welcome, Student!
     </p>
     <p class="greeting" v-else-if="$route.path.indexOf('/onboarding') !== -1">
       Welcome, Volunteer!
     </p>
     <p class="greeting" v-else>
       {{name}}
     </p>
   </template>
 </div>
</template>

<script>

import UserService from '../../services/UserService';

export default {
 components: {

 },
 data() {
   let user = UserService.getUser() || {};

   var avatarUrl = user.picture || 'static/defaultavatar3.png';
   return {
     user: user,
     name: user.firstname + ' ' + user.lastname || (user.isVolunteer ? 'volunteer' : 'student'),
     avatarStyle: {
       backgroundImage: `url(${avatarUrl})`
     }
   }
 },
  methods: {
    logout(){
      AuthService.logout(this);
    }
  }
}
</script>

<style scoped>
  .avatar {
    display: block;
    width: 60px;
    height: 60px;
    margin: 0 auto;
    background-size: cover;
  }

  .greeting {
    margin-top: 12px;
    margin-bottom: 0;
    font-size: 16px;
  }

  .edit-profile {
    font-size: 12px;
    color: #73737A;
  }


</style>
