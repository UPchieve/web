<template>
  <div class="logout">
    <h1>You're logged out!</h1>
    <router-link to="/" tag="button" class="btn btn-lg btn-primary btn-block" active-class="">Go to Main Website</router-link>
    <router-link to="/feedbac," tag="button" class="btn btn-lg btn-primary btn-block" active-class="">Give Feedback</router-link>
  </div>
</template>

<script>
export default {
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
  font-weight: 700;
  margin-bottom: 100px;
  text-align: left;
}

button {
  width: 250px;
  background-color: #16D2AA;
  border: none;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
}
</style>
