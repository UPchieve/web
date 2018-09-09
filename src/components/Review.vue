<template>
  <div
    v-if="user.isVolunteer"
    class="review">
    <h1
      v-if="category !== 'esl'"
      class="header">{{ category | capitalize }} Review</h1>
    <h1
      v-if="category === 'esl'"
      class="header">{{ category | uppercase }} Review</h1>
  </div>
</template>

<script>
import UserService from 'src/services/UserService';

export default {
  filters: {
    capitalize(value) {
      if (!value) return '';
      const valueStr = value.toString();
      return valueStr.charAt(0).toUpperCase() + valueStr.slice(1);
    },
    uppercase(value) {
      if (!value) return '';
      return value.toString().toUpperCase();
    },
  },
  data() {
    const user = UserService.getUser();
    const { category } = this.$route.params;
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
