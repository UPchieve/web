<template>
  <tr class="list-item">
    <td class="list-item__cell">{{ readyForReviewAt }}</td>
    <td class="list-item__cell bold">
      <router-link :to="`/admin/users/${volunteer._id}`">{{
        fullName
      }}</router-link>
    </td>
    <td class="list-item__cell">{{ volunteer.email }}</td>
  </tr>
</template>

<script>
import moment from 'moment'

export default {
  name: 'PendingVolunteerListItem',
  props: {
    volunteer: { type: Object, required: true }
  },
  computed: {
    readyForReviewAt() {
      return moment(this.volunteer.readyForReviewAt).format('l, h:mm a')
    },

    fullName() {
      return `${this.volunteer.firstname} ${this.volunteer.lastname}`
    }
  }
}
</script>

<style lang="scss" scoped>
.list-item {
  padding: 20px 40px;
  text-decoration: none;
  color: $c-soft-black;

  &:hover {
    text-decoration: none;
  }

  &__cell {
    padding: 20px 40px;
    flex-basis: 100px;
    text-align: left;
    flex-grow: 1;
  }
}

.bold {
  font-weight: 600;
}
</style>
