<template>
    <div class="parent">
        <div class="container-section linkBtn btn">
            <router-link to="metrics" class="prompt"
            >Metrics</router-link>
        </div>
        <div class = "container-section linkBtn btn">
          <router-link to="/edu" class="prompt"
            >Edu Admin</router-link>
        </div>
    </div>
</template>

<script>
export default{
    data () {
        return {
            message: 'UPchieve!'
        }
        }
    }
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
  color: #2c3e50;
}

.linkBtn a:hover {
  color: white;
  text-decoration: none;
}

 .parent {
  padding: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

</style>