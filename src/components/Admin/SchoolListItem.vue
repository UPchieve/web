<template>
  <router-link :to="`/admin/school/${school._id}`" class="list-item">
    <p class="list-item__column">{{ school.name }}</p>
    <p class="list-item__column">{{ school.city }}, {{ school.state }}</p>
    <p class="list-item__column">{{ school.zipCode }}</p>
    <p class="list-item__column">{{ approvalStatus }}</p>
  </router-link>
</template>

<script>
export default {
  name: "SchoolListItem",
  props: {
    school: Object
  },
  computed: {
    approvalStatus() {
      return this.school.isApproved ? "Approved" : "Not approved";
    }
  }
};
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
    text-align: left;
    flex-basis: 200px;
  }
}
</style>
