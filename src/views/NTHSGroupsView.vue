<script setup lang="ts">
import Spinner from '@/components/Spinner.vue'
import { onMounted, ref, useTemplateRef } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const email = store.state.user.user.email
const iframe = useTemplateRef('iframe')
const isLoaded = ref(false)
onMounted(() => {
  if (iframe.value !== null) {
    iframe.value.onload = () => {
      isLoaded.value = true
    }
  }
})
</script>

<template>
  <div class="container">
    <h2 class="title">{{ store.state.volunteer.NTHSGroups[0].groupName }}</h2>
    <iframe
      ref="iframe"
      class="iframe"
      :class="isLoaded ? '' : 'hide'"
      :src="`https://upchieve.retool.com/embedded/public/3362bf53-b543-40ea-b47d-e8d25fd86583?email=${email}`"
      width="100%"
      height="100%"
      loading="lazy"
    />
    <div class="spinner-container" v-if="!isLoaded">
      <Spinner />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.title {
  padding: 1em 0 0 1em;
}
.spinner-container {
  flex-grow: 1;
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: center;
}
.hide {
  width: 0;
  height: 0;
  opacity: 0;
}
.container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: start;
}
.iframe {
  border: none;
}
</style>
