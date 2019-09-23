<template>
  <div class="row">
    <div class="col-sm-12">
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLScP9FUKeeH869Z1x4vk4JxyYFiPnDHwVKZAMYGa5eErOGhnFw/viewform?embedded=true"
        width="100%"
        height="1000"
        frameborder="0"
        marginheight="0"
        marginwidth="0"
      >
        Loading...
      </iframe>
    </div>
  </div>
</template>

<script>
import UserService from "@/services/UserService";

export default {
  name: "ContactView",
  created() {
    Promise.all([AuthService.getAuth(this), UserService.getUser(this)])
      .then((result) => {
        const [user, auth] = result
        this.auth = auth;
        this.user = user;
        if (!this.auth.authenticated && !this.user.verified) {
          this.$store.dispatch("app/hideNavigation");
        }
      });
  },
  data() {
    return {
      auth: null,
      user: null
    };
  }
};
</script>

<style lang="scss" scoped></style>
