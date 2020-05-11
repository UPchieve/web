<template>
  <router-link :to="`/admin/users/${user._id}`" class="user-preview">
    <div class="user-preview__left">
      <div class="user-preview__icon">{{ userIcon }}</div>
    </div>
    <div class="user-preview__middle">
      <div class="user-preview__title">
        {{ user.firstname }}
      </div>
      <div class="user-preview__subtitle">joined {{ userSince }}</div>
    </div>
    <div class="user-preview__right">
      <div>{{ sessions }}</div>
    </div>
  </router-link>
</template>

<script>
import moment from "moment";

export default {
  props: {
    user: Object
  },
  computed: {
    userIcon() {
      return this.user.isVolunteer ? "🍎" : "🎓";
    },
    userSince() {
      return moment(this.user.createdAt).fromNow();
    },
    sessions() {
      const count = this.user.pastSessions ? this.user.pastSessions.length : 0;
      return `${count} session${count === 1 ? "" : "s"}`;
    }
  }
};
</script>

<style lang="scss" scoped>
.user-preview {
  display: flex;
  flex-direction: row;
  min-width: 300px;
  width: 100%;
  max-width: 400px;
  background: #fff;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border-radius: 4px;
  font-size: 14px;
  color: $c-soft-black;
  text-decoration: none;

  &:hover {
    cursor: pointer;
    background: #f9f9f9;
    text-decoration: none;
  }

  &__left {
    flex-shrink: 1;
    margin: 0 14px 0 5px;
  }

  &__icon {
    font-size: 28px;
  }

  &__middle {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    flex-grow: 1;
  }

  &__title {
    font-weight: 600;
  }

  &__subtitle {
    font-size: 13px;
    color: $c-secondary-grey;
  }

  &__right {
    margin-right: 5px;
  }
}
</style>
