<script lang="ts" setup>
import FormPageTemplate from '@/components/FormPageTemplate.vue'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import UpdogCrying from '@/assets/updog-crying.svg'

const isLogout = ref(true)
const $route = useRoute()

onMounted(() => {
  if ($route.query.deleted) {
    isLogout.value = false
  }
})
</script>

<template>
  <form-page-template>
    <div v-if="isLogout" class="uc-form">
      <h1 class="title">You're logged out!</h1>

      <router-link to="/login" class="uc-form-button" tag="button">
        Login
      </router-link>
    </div>
    <div v-else class="uc-form">
      <h1 class="title">We're sad to see you go!</h1>
      <updog-crying />
      <h2 class="subtitle center">
        Thank you for giving UPchieve a try. You are always welcome back if you
        ever change your mind!
      </h2>
    </div>
  </form-page-template>
</template>

<style lang="scss" scoped>
.uc-form {
  @include flex-container(column, center, center);
}

.title {
  color: black;
  font-size: 24px;
  font-weight: 600;
  margin: 50px 0px;
  text-align: center;
}

.subtitle {
  font-size: 20px;
  font-weight: 400;
}
</style>
