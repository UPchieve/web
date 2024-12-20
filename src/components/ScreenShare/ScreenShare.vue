<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import FloatingWindow from '../FloatingWindow.vue'
import { useStore } from 'vuex'
import { ScreenShareEvent } from '@/services/LiveShareService/machines/screenShareMachine'

const store = useStore()
const emit = defineEmits<{
  (e: 'dragging', v: boolean): void
  (e: 'resizing', v: boolean): void
}>()
const props = defineProps<{
  firstName: string
  canShareScreen: boolean
  isVolunteer: boolean
}>()

const stream = store.state.liveMedia.zoomClient.getMediaStream()
const useVideoElement =
  props.isVolunteer && stream.isStartShareScreenWithVideoElement()
const screenShareActor = store.state.liveMedia.screenShareActor

const screenShareCanvas = ref<HTMLCanvasElement>()
const screenShareVideo = ref<HTMLVideoElement>()

onMounted(() => {
  const targetElement = useVideoElement
    ? screenShareVideo.value
    : screenShareCanvas.value
  screenShareActor.send(ScreenShareEvent.VIEWER_READY, { targetElement })
})
onUnmounted(async () => {
  await screenShareActor.send(ScreenShareEvent.VIEWER_REMOVED)
})
</script>

<template>
  <FloatingWindow
    @dragging="(event) => emit('dragging', event)"
    @resizing="(event) => emit('resizing', event)"
    :contentSize="store.state.liveMedia.screenShare.screenShareDimensions"
    :independentResize="false"
  >
    <template #header>{{ props.firstName }}'s screen </template>
    <template #body>
      <video
        v-if="useVideoElement"
        height="auto"
        width="auto"
        ref="screenShareVideo"
      ></video>
      <canvas
        v-else
        width="auto"
        height="auto"
        ref="screenShareCanvas"
      ></canvas>
    </template>
  </FloatingWindow>
</template>

<style scoped lang="scss">
video,
canvas {
  max-width: 100%;
  max-height: 98%;
  padding-top: 2%;
  width: auto;
  height: auto;
}
</style>
