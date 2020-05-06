<template>
  <div class="sessions-list-wrapper">
    <div class="sessions-list">
      <session-list-item
        v-for="session in sessions"
        :key="session._id"
        :session="session"
      />
    </div>
  </div>
</template>

<script>
import SessionListItem from "./SessionListItem";

export default {
  name: "SessionsList",

  props: {
    sessions: Array[Object]
  },

  components: { SessionListItem }
};
</script>

<style lang="scss" scoped>
.sessions-list-wrapper {
  overflow-x: scroll;
}

.sessions-list {
  min-width: 750px;
  max-width: 1200px;
}
</style>
