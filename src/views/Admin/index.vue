<template>
  <div class="admin-view">
    <div class="header">Admin Dashboard</div>
    <div class="parent">
      <div class="container-section linkBtn btn">
        <router-link to="metrics" class="prompt">Metrics</router-link>
      </div>
      <div class = "container-section linkBtn btn">
        <router-link to="/edu" class="prompt">Edu Admin</router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default {}
</script>


<style lang="scss" scoped>
.container-section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 20px;
}

.linkBtn {
  background-color: #16d2aa;
  border-radius: 30px;
  align-items: center;
  height: 50px;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.linkBtn a {
  color: white;
}

.linkBtn a:hover {
  color:#2c3e50;
  text-decoration: none;
}

.parent {
  padding: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
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
