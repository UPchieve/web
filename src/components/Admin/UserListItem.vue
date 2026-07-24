<template>
  <router-link :to="`/admin/users/${user.id}`" class="list-item">
    <p class="list-item__column">{{ user.id }}</p>
    <p class="list-item__column">{{ createdAt }}</p>
    <p class="list-item__column">{{ user.firstName }} {{ user.lastName }}</p>
    <p class="list-item__column list-item__column--email">{{ user.email }}</p>
    <p class="list-item__column">{{ userType }}</p>
  </router-link>
</template>

<script>
import { dayjs } from '@/utils/time-utils'

export default {
  name: 'UserListItem',

  props: {
    user: Object,
  },

  computed: {
    userType() {
      const roles = this.user.roles
      if (!roles?.length) return ''
      return roles.map((r) => r.charAt(0).toUpperCase() + r.slice(1)).join(', ')
    },
    createdAt() {
      return dayjs(this.user.createdAt).format('l, h:mm a')
    },
  },
}
</script>

<style lang="scss" scoped>
.list-item {
  @include flex-container(row, space-between, center);
  padding: 10px 40px;
  text-decoration: none;
  color: $c-soft-black;
  border-bottom: 1px solid #f0f4f9;

  &:hover {
    cursor: pointer;
    background: #fbfbfb;
    text-decoration: none;
  }

  &__column {
    flex: 1;
    min-width: 0;
    padding-right: 12px;
    text-align: left;
    font-size: 0.9em;

    &--email {
      overflow-wrap: break-word;
      word-break: break-all;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
}

.bold {
  font-weight: 600;
}
</style>
