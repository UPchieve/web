<template>
  <div class="logout">
    <h1>You're logged out!</h1>
    <a class="btn btn-lg btn-primary btn-block" href="http://www.upchieve.org">Go to Main Website</a>
    <router-link to="/feedback" class="btn btn-lg btn-primary btn-block">Give Feedback</router-link>
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

.btn {
  width: 250px;
  background-color: #16D2AA;
  border: none;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
}

.btn:hover {
  background-color: #16D2AA;
}
</style>
