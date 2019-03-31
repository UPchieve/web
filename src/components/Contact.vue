<template>
  <div
    :class="{ background: !auth.authenticated && !user.verified }"
    class="row"
  >
    <div class="col-sm-12">
      <iframe
        src="https://docs.google.com/forms/d/e/1FAIpQLScP9FUKeeH869Z1x4vk4JxyYFiPnDHwVKZAMYGa5eErOGhnFw/viewform?embedded=true"
        width="100%"
        height="1000"
        frameborder="0"
        marginheight="0"
        marginwidth="0"
        >Loading...</iframe
      >
    </div>
  </div>
</template>

<script>
import UserService from 'src/services/UserService'

export default {
  data () {
    const auth = UserService.getAuth()

    const user = UserService.getUser()
    return {
      auth,
      user
    }
  }
}
</script>

<style scoped>
.background {
  margin-left: -350px;
  position: relative;
  z-index: 2;
}


@media screen and (max-width: 488px) {
  .background {
    margin-left: 0em !important;
    padding-left: 0em !important;
    padding-top: 0.5em !important;
  }

  .col-sm-12 {
    padding: 0em !important;
  }
}
</style>
