<template>
  <router-link :to="`/admin/school/${school._id}`" class="list-item">
    <p class="list-item__column">{{ school.name }}</p>
    <div class="list-item__column">
      <p>{{ school.city }}, {{ school.state }}</p>
      <p>{{ school.zipCode }}</p>
    </div>
    <p class="list-item__column">{{ approvalStatus }}</p>
  </router-link>
</template>

<script>
export default {
  name: 'SchoolListItem',
  props: {
    school: Object
  },
  computed: {
    approvalStatus() {
      return this.school.isApproved ? 'Approved' : 'Not approved'
    }
  }
}
</script>

<style lang="scss" scoped>
.list-item {
  @include flex-container(row, space-between, flex-start);
  padding: 20px 40px;
  text-decoration: none;
  color: $c-soft-black;

  &:hover {
    cursor: pointer;
    background: #fbfbfb;
    text-decoration: none;
  }

  &__column {
    text-align: left;
    flex-basis: 200px;
  }
}
</style>
