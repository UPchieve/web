<template>
  <router-link :to="`/admin/users/${user._id}`" class="list-item">
    <p class="list-item__column">{{ user.id }}</p>
    <p class="list-item__column">{{ createdAt }}</p>
    <p class="list-item__column">{{ user.firstName }} {{ user.lastName }}</p>
    <p class="list-item__column">{{ user.email }}</p>
    <p class="list-item__column">{{ userType }}</p>
  </router-link>
</template>

<script>
import moment from 'moment'
import { mapGetters } from 'vuex'

export default {
  name: 'UserListItem',

  props: {
    user: Object,
  },

  computed: {
    ...mapGetters({
      userType: 'user/userType',
    }),
    createdAt() {
      return moment(this.user.createdAt).format('l, h:mm a')
    },
  },
}
</script>

<style lang="scss" scoped>
.list-item {
  @include flex-container(row, space-between, center);
  padding: 20px 40px;
  text-decoration: none;
  color: $c-soft-black;

  &:hover {
    cursor: pointer;
    background: #fbfbfb;
    text-decoration: none;
  }

  &__column {
    min-width: 300px;
    text-align: left;
  }
}

.bold {
  font-weight: 600;
}
</style>
