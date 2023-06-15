<template>
  <router-link :to="`/admin/school/${school._id}`" class="list-item" tag="tr">
    <td>{{ school.name }}</td>
    <td>
      <div>{{ school.city }}, {{ school.state }}</div>
      <div>{{ school.zip }}</div>
    </td>
    <td>{{ adminApprovalStatus }}</td>
    <td>{{ approvalStatus }}</td>
    <td>{{ partnerStatus }}</td>
  </router-link>
</template>

<script>
export default {
  name: 'SchoolListItem',
  props: {
    school: Object,
  },
  computed: {
    adminApprovalStatus() {
      return this.school.isAdminApproved ? 'Yes' : 'No'
    },
    approvalStatus() {
      return this.school.isApproved ? 'Yes' : 'No'
    },
    partnerStatus() {
      return this.school.isPartner ? 'Yes' : 'No'
    },
  },
}
</script>

<style lang="scss" scoped>
.list-item {
  color: $c-soft-black;
  height: 60px;
  text-decoration: none;
  width: 100%;

  &:hover {
    cursor: pointer;
    background: #fbfbfb;
    text-decoration: none;
  }
}
</style>
