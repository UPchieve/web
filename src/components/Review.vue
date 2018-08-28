<template>
  <div
    v-if="user.isVolunteer"
    class="review">
    <h1
      v-if="category != 'esl'"
      class="header">{{ category | capitalize }} Review</h1>
    <h1
      v-if="category == 'esl'"
      class="header">{{ category | uppercase }} Review</h1>
  </div>
</template>

<script>
import UserService from 'src/services/UserService';

export default {
  filters: {
    capitalize(value) {
      if (!value) return '';
      value = value.toString();
      return value.charAt(0).toUpperCase() + value.slice(1);
    },
    uppercase(value) {
      if (!value) return '';
      value = value.toString();
      return value.toUpperCase();
    },
  },
  data() {
    const user = UserService.getUser();
    const category = this.$route.params.category;
    return {
      user,
      category,
    };
  },
  beforeMount() {
    this.styleImages();
  },
  methods: {
  },
};
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
