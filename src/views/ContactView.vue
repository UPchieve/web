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
import { mapGetters } from "vuex";

export default {
  name: "ContactView",
  created() {
    if (!this.isAuthenticated) {
      this.$store.dispatch("app/hideNavigation");
    }
  },
  computed: {
    ...mapGetters({
      isAuthenticated: "user/isAuthenticated"
    })
  },
  watch: {
    isAuthenticated(isAuthed) {
      if (isAuthed) {
        this.$store.dispatch("app/showNavigation");
      } else {
        this.$store.dispatch("app/hideNavigation");
      }
    }
  }
};
</script>

<style lang="scss" scoped></style>
