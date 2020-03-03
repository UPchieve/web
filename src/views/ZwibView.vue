<template>
  <div class="zwib-wrapper">
    <div id="zwib-div"></div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      zwibbler: null
    }
  },

  mounted() {
    const zwibblerCtx = window.Zwibbler.create("zwib-div", {
      collaborationServer: "ws://localhost:3000/socket/{name}"
    });

    this.zwibblerCtx = zwibblerCtx;

    const roomIdParam = this.$route.params.roomId || "";
    const roomId = zwibblerCtx.createSharedSession(roomIdParam);

    console.log("Room ID:", roomId);
  }
};
</script>

<style lang="scss" scoped>
.zwib-wrapper {
  border: dotted red 2px;
  margin: 20px;
}

#zwib-div {
  border: solid orange 2px;
  margin: 10px;
  height: 500px;
  width: 500px;
}
</style>
