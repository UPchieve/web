<script setup lang="ts">
import { computed, onMounted, ref, toRef } from 'vue'
import { useStore } from 'vuex'
import ImageExpand from '@/assets/image-expand.svg'
import ImageCollapse from '@/assets/image-collapse.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import type { useActor } from '@xstate/vue'
import { create } from '@/state-machines/meeting-machine'

const emit = defineEmits(['dragging', 'resizing'])

const MINIMUM_WIDTH = 300
const height = ref<number | string>('auto')
const width = ref<number>(MINIMUM_WIDTH)

const store = useStore()
const props = defineProps<{
  firstName: string
  canShareScreen: boolean
  isVolunteer: boolean
  containerRef: object
  meetingActor: ReturnType<typeof useActor<ReturnType<typeof create>>>
}>()

const meetingVideo = ref<HTMLVideoElement>()
const screenShareWindow = ref()
const sizeState = ref<'minimized' | 'maximized' | 'user-sized'>('user-sized')

const screenShareDimensions = computed(
  () => store.state.liveMedia.screenShare.screenShareDimensions
)
const aspectRatio = computed(() => {
  return screenShareDimensions.value?.width >
    screenShareDimensions.value?.height
    ? screenShareDimensions.value?.width / screenShareDimensions.value?.height
    : screenShareDimensions.value?.height / screenShareDimensions.value?.width
})

// for expanding the screenshare window to maximum size
const previousWidth = ref<number>(MINIMUM_WIDTH)
const previousHeight = ref<number | string>('auto')

onMounted(() => {
  props.meetingActor.send({
    type: 'video_ui_loaded',
    videoOutputElement: meetingVideo.value!,
  })
})

const windowHeader = ref()
const windowContent = ref()

const toggleMinimizeWindow = () => {
  if (sizeState.value === 'minimized') sizeState.value = 'user-sized'
  else sizeState.value = 'minimized'
  if (sizeState.value === 'minimized') {
    width.value = MINIMUM_WIDTH
    AnalyticsService.captureEvent(EVENTS.SCREENSHARE_USER_MINIMIZED_SCREENSHARE)
  }
}

const toggleMaximizeWindow = () => {
  if (sizeState.value === 'maximized') sizeState.value = 'user-sized'
  else sizeState.value = 'maximized'

  const enclosingContainer = toRef<HTMLElement>(props, 'containerRef')
  const rect = enclosingContainer.value!.getBoundingClientRect()
  if (sizeState.value == 'maximized') {
    // Set current dimensions to previous, then maximize the window
    previousWidth.value = width.value
    previousHeight.value =
      typeof height.value === 'number' ? height.value : getWindowHeight()
    width.value = rect.width
    height.value = 'auto'
  } else {
    width.value = previousWidth.value
    height.value = 'auto'
  }
}

const getWindowHeight = (): number => {
  return screenShareWindow.value!.$el.getBoundingClientRect().height
}

const resize = (x, y, requestedWidth) => {
  emit('resizing', true)
  sizeState.value = 'user-sized'
  height.value = 'auto'
  const heightPx = getWindowHeight()
  const largerDimension: 'width' | 'height' =
    screenShareDimensions.value?.width > screenShareDimensions.value?.height
      ? 'width'
      : 'height'

  if (largerDimension === 'width') {
    width.value = requestedWidth
  } else {
    width.value = Math.round(heightPx * aspectRatio.value)
  }
  previousWidth.value = width.value
  previousHeight.value = height.value
}
</script>

<template>
  <vue-draggable-resizable
    ref="screenShareWindow"
    :y="70"
    :x="8"
    class="window"
    :enable-native-drag="false"
    :active="true"
    :parent="true"
    :z="10"
    :style="{
      position: 'absolute',
    }"
    @resizing="resize"
    @resizeStop="emit('resizing', false)"
    @dragging="emit('dragging', true)"
    @dragStop="emit('dragging', false)"
    :handles="sizeState === 'minimized' ? [] : ['br', 'bl', 'mr', 'ml']"
    :drag-handle="'.window-header'"
    :class-name-active="'active'"
    :prevent-deactivation="true"
    :lock-aspect-ratio="sizeState !== 'minimized'"
    :min-width="MINIMUM_WIDTH"
    :h="height"
    :w="width"
  >
    <div class="window-header" ref="windowHeader">
      {{ props.firstName }}'s screen
      <div class="resize-buttons">
        <button @click="toggleMaximizeWindow" class="resize-button">
          <ImageExpand v-if="sizeState !== 'maximized'" />
          <ImageCollapse v-else />
        </button>
        <button @click="toggleMinimizeWindow" class="resize-button">-</button>
      </div>
    </div>
    <div
      class="window-content"
      v-show="sizeState !== 'minimized'"
      ref="windowContent"
    >
      <video height="auto" width="auto" ref="meetingVideo"></video>
    </div>
  </vue-draggable-resizable>
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

.window {
  background: $c-background-grey;
  display: block;
}

.window-header {
  grid-area: 1 / 1 / 3 / 4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: $c-information-blue;
  min-height: 48px;
  cursor: grab;

  font-size: 18px;
  font-weight: 500;
  color: white;
  padding-left: 18px;
  border: 1px solid white;
}

.resize-buttons {
  display: flex;
  justify-content: end;
  align-items: end;
}

.resize-button {
  color: white;
  font-weight: 300;
  line-height: 1em;
  font-size: 44px;
  padding: 0 8px;
}

.resize-button :deep(path) {
  fill: white;
}

.active {
  border: none;
}
</style>
