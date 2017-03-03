<template>
  <div class="logout">
    <h1>You're logged out!</h1>
    <a class="btn btn-lg btn-primary btn-block" v-bind:href="mainWebsiteUrl">Go to Main Website</a>
    <router-link to="/feedback" class="btn btn-lg btn-primary btn-block">Give Feedback</router-link>
    <router-link to="/login" class="login">Log back in</router-link>
  </div>
</template>

<script>
export default {
  data(){
    return {
      mainWebsiteUrl: process.env.MAIN_WEBSITE_URL
    }
  }
}
</script>

<style scoped>
.logout {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  max-width: 500px;
  padding: 15px;
  margin: auto;
  padding-left: 100px;
}

h1 {
  color: #16D2AA;
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 100px;
}

.btn {
  width: 250px;
  background-color: #16D2AA;
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  margin-left: auto;
  margin-right: auto;
}

.btn:hover {
  background-color: #16D2AA;
}

a.login {
  margin-top: 200px;
}
</style>
