<template>
  <div class="logout background">
    <div class="form-signout">
      <h1>You're logged out!</h1>
      <div class="button-container">
        <router-link
          to="/login"
          class="btn login">LOGIN</router-link>
        <router-link
          to="/feedback"
          class="btn btn-lg btn-primary btn-block feedback">GIVE FEEDBACK</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mainWebsiteUrl: process.env.MAIN_WEBSITE_URL,
    };
  },
};
</script>

<style scoped>
.logout {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.col-xs-12.view-container {
  padding-left: 0;
  padding-right: 0;
  z-index: 1;
}

h1 {
  color: #000;
  font-size: 24px;
  font-weight: 600;
  margin: 100px 0px;
}

.background {
  display: flex;
  background-image: url('../assets/onboarding_background.png');
  background-size: cover;
  height: 100%;
  font-size: 16px;
  margin-left: -300px;
  position: relative;
  z-index: 2;
}

.form-signout {
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 500px;
  height: 500px;
  margin: auto;
  background-color: white;
  padding: 0px 75px;
}

.btn {
  background-color: #F6F6F6;
  border: none;
  font-weight: 600;
  color: #16D2AA;
  height: 40px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
}

.btn:hover, .btn:active, .btn.feedback:active {
  color: white;
  background-color: #16D2AA;
}

</style>
