<template>
  <div class="admin-view">
    <div class="header">Admin Dashboard</div>
    <div class="admin-directory">
      <router-link to="/admin/volunteer-coverage" class="admin-link btn"
        >Volunteer Coverage</router-link
      >
      <router-link to="/admin/sessions" class="admin-link btn"
        >Sessions</router-link
      >
      <router-link to="/edu" class="admin-link btn">Edu Admin</router-link>

      <router-link to="/admin/volunteers/pending" class="admin-link btn"
        >Pending Volunteers</router-link
      >
      <router-link to="/admin/ineligible-students" class="admin-link btn"
        >Ineligible Students</router-link
      >
    </div>
  </div>
</template>

<script>
export default {};
</script>

<style lang="scss" scoped>
.admin-directory {
  padding: 60px 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.admin-link {
  background-color: #16d2aa;
  border-radius: 30px;
  height: 50px;
  line-height: 50px;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  padding-top: 0;
  padding-bottom: 0;
  margin-bottom: 30px;
  max-width: 500px;

  &:hover {
    color: #2c3e50;
  }
}

.header {
  display: flex;
  padding: 30px;
  margin: 0;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}
</style>
