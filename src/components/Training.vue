<template>
  <div v-if="user.isVolunteer" class="training">
    <div class="header">
      Choose a topic that you would like to help students with! Don’t worry, you can come back to this page later and select additional topics.
    </div>
    <router-link to="/training/math" tag="li">Math Training</router-link>
    <router-link to="/training/college" tag="li">College Counseling Training</router-link>
  </div>
</template>

<script>
import UserService from 'src/services/UserService';
export default {
  data() {
    var user = UserService.getUser();
    return {
      user: user,
    }
  }
}
</script>

<style scoped>
</style>
