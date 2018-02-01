<template>
  <div v-if="user.isVolunteer" class="review">
    <h1 class="header" v-if="category != 'esl'">{{ category | capitalize }} Review</h1>
    <h1 class="header" v-if="category == 'esl'">{{ category | uppercase }} Review</h1>
  </div>
</template>

<script>
import UserService from 'src/services/UserService';
export default {
  data() {
    let user = UserService.getUser();
    let category = this.$route.params.category;
    return {
      user: user,
      category: category
    }
  },
  beforeMount() {
    this.styleImages();
  },
  filters: {
    capitalize: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.charAt(0).toUpperCase() + value.slice(1)
    },
    uppercase: function (value) {
      if (!value) return ''
      value = value.toString()
      return value.toUpperCase()
    }
  },
  methods: {
  }
}
</script>

<style scoped>

.header {
  display: flex;
  padding: 30px;
  margin: 0px;
  font-size: 24px;
  border-bottom: 0.5px solid #CCCCCF;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
}

</style>
