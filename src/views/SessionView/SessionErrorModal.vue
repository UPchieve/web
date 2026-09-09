<script lang="ts">
export default {
  name: 'SessionErrorModal',
}
</script>
<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import LargeButton from '@/components/LargeButton.vue'
import type { SessionErrorModalData } from '@/services/ModalService'

type Props = {
  modalData: SessionErrorModalData
}

defineExpose({
  onAccept,
})

const props = defineProps<Props>()
const store = useStore<any>()
const router = useRouter()

const mobileMode = computed(() => store.getters['app/mobileMode'])

const errorMessage = props.modalData.errorMessage
const errorTitle = props.modalData.errorTitle

function onAccept() {
  if (props.modalData.onAccept) {
    props.modalData.onAccept()
  } else {
    router.push('/')
  }
}

const text = computed(() => ({
  title: errorTitle || 'Session Error',
  body: errorMessage || 'Something went wrong. Please try joining again.',
}))
</script>

<template>
  <div class="container">
    <h1 class="title">{{ text.title }}</h1>
    <div class="body">{{ text.body }}</div>

    <large-button
      v-if="mobileMode"
      @click="onAccept"
      variant="primary-blue"
      :showArrow="false"
      >{{ modalData.acceptText }}</large-button
    >
  </div>
</template>

<style lang="scss" scoped>
.container {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above('medium') {
    @include child-spacing(top, 16px);
  }
}

.title {
  @include font-category('display-small');
  @include breakpoint-above('medium') {
    margin-top: 24px;
  }
}

.body {
  @include font-category('body');
}
</style>
