<template>
  <div v-if="user.isVolunteer" class="math-training">
    <div class="header">Math Training</div>
    <router-link to="/training/quiz" tag="li">Certification Quiz</router-link>
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
