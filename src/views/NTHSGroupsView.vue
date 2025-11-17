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
    <iframe
      ref="iframe"
      class="iframe"
      :class="isLoaded ? '' : 'hide'"
      :src="`https://upchieve.retool.com/embedded/public/3362bf53-b543-40ea-b47d-e8d25fd86583?email=${email}`"
      width="100%"
      height="100%"
      loading="lazy"
    />
    <Spinner v-if="!isLoaded" />
  </div>
</template>

<style lang="scss" scoped>
.hide {
  width: 0;
  height: 0;
  opacity: 0;
}
.container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.iframe {
  border: none;
}
</style>
