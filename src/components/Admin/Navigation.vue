<template>
    <div class="center">
        <div class="container-section linkBtn btn">
            <router-link to="metrics" class="prompt"
            >Metrics</router-link>
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
  width: 200px;
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

.center {
  margin: 100px;
  width: 50%;
  padding: 10px;
}
</style>