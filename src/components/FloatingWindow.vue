<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import ImageExpand from '@/assets/image-expand.svg'
import ImageCollapse from '@/assets/image-collapse.svg'

const props = defineProps<{
  contentSize: {
    width: number
    height: number
  }
  independentResize: boolean
}>()

const emit = defineEmits<{
  (e: 'minimize'): void
  (e: 'maximize'): void
  (e: 'dragging', v: boolean): void
  (e: 'resizing', v: boolean): void
}>()
const store = useStore()
const isMobileMode = computed(() => store.getters['app/mobileMode'])
const CONTAINER_SELCTOR = '.session-contents-container'

const dominantDimension = computed(() => {
  const ratio = position.width / position.height
  return ratio > 1 ? 'width' : 'height'
})

const MIN_DIMENSIONS = {
  width: 320,
  height: 410,
}

const SMALL_SCREEN = {
  top: 88,
  left: 10,
}

const NOT_SMALL_SCREEN = {
  top: 70,
  left: 70,
  width: 400,
  height: 770,
}

const containerRef = ref<HTMLTextAreaElement>()
const headerRef = ref<HTMLTextAreaElement>()

const position = reactive<{
  startingLeft: null | number
  startingTop: null | number
  top: number
  left: number
  width: number
  height: number
  isDragging: boolean
  isResizing: boolean
  touchstartY: null | number
  touchstartX: null | number
  offsetY: null | number
  offsetX: null | number
}>({
  startingLeft: null,
  startingTop: null,
  top: isMobileMode.value ? SMALL_SCREEN.top : 70,
  left: isMobileMode.value ? SMALL_SCREEN.left : 70,
  width: NOT_SMALL_SCREEN.width,
  height: NOT_SMALL_SCREEN.height,
  isDragging: false,
  isResizing: false,
  touchstartX: null,
  touchstartY: null,
  offsetY: null,
  offsetX: null,
})

const isMinimized = ref(false)
const isMaximized = ref(false)
const previousHeight = ref(0)
const previousWidth = ref(0)
const previousTop = ref(0)
const previousLeft = ref(0)
const previousUserSizedHeight = ref(NOT_SMALL_SCREEN.height)
const previousUserSizedWidth = ref(NOT_SMALL_SCREEN.width)

const endResizing = () => {
  position.isResizing = false
  emit('resizing', false)
}

/*
  Account for border and padding of conatiner element
*/
function getInnerDimensions(element: HTMLElement) {
  const computedStyle = getComputedStyle(element)

  const paddingX =
    parseFloat(computedStyle.paddingLeft) +
    parseFloat(computedStyle.paddingRight)
  const paddingY =
    parseFloat(computedStyle.paddingTop) +
    parseFloat(computedStyle.paddingBottom)

  const borderX =
    parseFloat(computedStyle.borderLeftWidth) +
    parseFloat(computedStyle.borderRightWidth)
  const borderY =
    parseFloat(computedStyle.borderTopWidth) +
    parseFloat(computedStyle.borderBottomWidth)

  // Element width and height minus padding and border
  const elementInnerWidth = element.offsetWidth - paddingX - borderX
  const elementInnerHeight = element.offsetHeight - paddingY - borderY
  return {
    elementInnerWidth,
    elementInnerHeight,
  }
}

function toggleMinimizeWindow() {
  isMinimized.value = !isMinimized.value
}

function toggleMaximizeWindow() {
  isMinimized.value = false
  isMaximized.value = !isMaximized.value
}

function calculateMaximizedWindowSize() {
  const ratio = props.contentSize.width / props.contentSize.height
  const container = document.querySelector(CONTAINER_SELCTOR)
  const { elementInnerWidth, elementInnerHeight } = getInnerDimensions(
    container as HTMLElement
  )
  const smallerWindowDimension = Math.min(elementInnerWidth, elementInnerHeight)
  const smallerWindowDimensionName =
    smallerWindowDimension === elementInnerWidth ? 'width' : 'height'
  const smallerDimension = smallerWindowDimension
  return smallerWindowDimensionName === 'width'
    ? { newWidth: smallerDimension, newHeight: smallerDimension / ratio }
    : { newHeight: smallerDimension, newWidth: smallerDimension / ratio }
}

/*
  This handles the transitions between minimized, maximized, and user-sized.
  It's a bit complex because we want to support these specific resize paths:

    1. user-sized -> (event: minimize) -> minimized -> (event: maximize) -> maximized -> (event: unmaximize) -> user-sized
    2. user-sized -> (event: maximize) -> maximized -> (event: minimize) -> minimized -> (event: unminimize) -> maximized -> (event: unmaximize) -> user-sized

  The others are fairly straightforward.

*/
function handleMaxMin(
  [currentMaximized, currentMinimized]: boolean[],
  [previousMaximized, previousMinimized]: boolean[]
) {
  if (currentMinimized) {
    previousHeight.value = position.height
    previousWidth.value = position.width
    position.height = headerRef.value?.clientHeight ?? 0
    position.width = MIN_DIMENSIONS.width
    return
  } else if (currentMinimized !== previousMinimized && !currentMaximized) {
    position.height = previousHeight.value
    position.width = previousWidth.value
    return
  }

  if (currentMaximized) {
    previousHeight.value = position.height
    previousWidth.value = position.width
    previousTop.value = position.top
    previousLeft.value = position.left

    const { newWidth, newHeight } = calculateMaximizedWindowSize()

    position.width = newWidth
    position.height = newHeight

    position.top = 0
    position.left = 0
  } else if (currentMaximized !== previousMaximized && !currentMinimized) {
    const container = document.querySelector(CONTAINER_SELCTOR)
    const { elementInnerWidth, elementInnerHeight } = getInnerDimensions(
      container as HTMLElement
    )
    if (
      (previousHeight.value <= (headerRef.value?.clientHeight ?? 0) &&
        previousWidth.value <= MIN_DIMENSIONS.width) ||
      (previousHeight.value === elementInnerHeight &&
        previousWidth.value === elementInnerWidth)
    ) {
      position.height = previousUserSizedHeight.value
      position.width = previousUserSizedWidth.value
    } else {
      position.height = previousHeight.value
      position.width = previousWidth.value
    }
    position.top = previousTop.value
    position.left = previousLeft.value
  }
}

/* TODO: Refactor component to move `handleMaxMin` out of a watcher */
watch(() => [isMaximized.value, isMinimized.value], handleMaxMin)
// Adjust the window size to the content size if it changes
watch(
  () => props.contentSize,
  (newSize) => {
    position.width = newSize.width
    position.height = newSize.height
  }
)

const emitDragging = ref(false)
const emitResizing = ref(false)

function updatePosition(event: MouseEvent) {
  if (!(position.isDragging || position.isResizing)) return
  requestAnimationFrame(() => {
    if (
      event.which === 1 &&
      position.isDragging &&
      position.startingTop &&
      position.startingLeft
    ) {
      position.left = event.movementX + position.left
      position.top = event.movementY + position.top

      // Only emit once. this needs to be in mousemove otherwise we count click as a drag
      if (!emitDragging.value) {
        emitDragging.value = true
        emit('dragging', true)
      }
    } else {
      position.isDragging = false
      emitDragging.value = false
      emit('dragging', false)
    }

    if (event.which === 1 && position.isResizing) {
      // independentResize means that you can resize the width indpenedently of the height
      if (props.independentResize) {
        const newWidth = event.movementX + position.width
        const newHeight = event.movementY + position.height
        position.width =
          newWidth < MIN_DIMENSIONS.width ? MIN_DIMENSIONS.width : newWidth
        position.height =
          newHeight < MIN_DIMENSIONS.height ? MIN_DIMENSIONS.height : newHeight

        previousUserSizedHeight.value = position.height
        previousUserSizedWidth.value = position.width
      } else {
        // for applications like screenshare, we want to lock the aspect ratio by resizing the width and height together
        const maxMovement = Math.max(event.movementX, event.movementY)
        const newWidth = maxMovement + position.width
        const newHeight = maxMovement + position.height
        position.width =
          newWidth < MIN_DIMENSIONS.width ? MIN_DIMENSIONS.width : newWidth
        position.height =
          newHeight < MIN_DIMENSIONS.height ? MIN_DIMENSIONS.height : newHeight

        previousUserSizedHeight.value = position.height
        previousUserSizedWidth.value = position.width
      }
      // Only emit once. this needs to be in mousemove otherwise we count click as a resize
      if (!emitResizing.value) {
        emitResizing.value = true
        emit('resizing', true)
      }
    } else {
      if (emitResizing.value) {
        position.isResizing = false
        emitResizing.value = false
        emit('resizing', false)
      }
    }
  })
}

function updatePositionTouch(event) {
  if (!(position.isDragging || position.isResizing)) return
  // Prevent default will stop the screen from being dragged around (e.g. pull to refresh)
  event.preventDefault()
  for (const touch of event.targetTouches) {
    requestAnimationFrame(() => {
      if (
        position.isDragging &&
        position.startingTop &&
        position.startingLeft &&
        position.touchstartY &&
        position.touchstartX &&
        position.offsetX &&
        position.offsetY
      ) {
        // Only emit once. this needs to be in touchmove otherwise we count touchstart as a drag
        if (!emitDragging.value) {
          emitDragging.value = true
          emit('dragging', true)
        }
        const moveX = touch.clientX - position.touchstartX
        position.left = moveX + position.left

        const moveY = touch.clientY - position.touchstartY
        position.top = moveY + position.top

        // offset where top-left corner is compared to mouse
        position.touchstartX = position.left + position.offsetX
        position.touchstartY = position.top + position.offsetY
      } else {
        position.isDragging = false
        emitDragging.value = false
        emit('dragging', false)
      }

      if (position.isResizing) {
        // Only emit once. this needs to be in touchmove otherwise we count touchstart as a resize
        if (!emitResizing.value) {
          emitResizing.value = true
          emit('resizing', true)
        }
        if (props.independentResize) {
          const moveX = touch.clientX - position.touchstartX
          const newWidth = moveX + position.width
          const moveY = touch.clientY - position.touchstartY
          position.touchstartX = touch.clientX
          position.touchstartY = touch.clientY
          const newHeight = moveY + position.height
          position.width =
            newWidth < MIN_DIMENSIONS.width ? MIN_DIMENSIONS.width : newWidth
          position.height =
            newHeight < MIN_DIMENSIONS.height
              ? MIN_DIMENSIONS.height
              : newHeight
          previousUserSizedHeight.value = position.height
          previousUserSizedWidth.value = position.width
        } else {
          const moveX = touch.clientX - position.touchstartX
          const moveY = touch.clientY - position.touchstartY
          // for applications like screenshare, we want to lock the aspect ratio by resizing the width and height together
          const maxMovement = Math.max(moveX, moveY)
          const newWidth = maxMovement + position.width
          const newHeight = maxMovement + position.height

          position.touchstartX = touch.clientX
          position.touchstartY = touch.clientY
          position.width =
            newWidth < MIN_DIMENSIONS.width ? MIN_DIMENSIONS.width : newWidth
          position.height =
            newHeight < MIN_DIMENSIONS.height
              ? MIN_DIMENSIONS.height
              : newHeight
          previousUserSizedHeight.value = position.height
          previousUserSizedWidth.value = position.width
        }
      } else {
        if (emitResizing.value) {
          position.isResizing = false
          emitResizing.value = false
          emit('resizing', false)
        }
      }
    })
  }
}
onMounted(async () => {
  addEventListener('mousemove', updatePosition)
})
onUnmounted(() => {
  removeEventListener('mousemove', updatePosition)
  if (isMobileMode.value) {
    removeEventListener('touchmove', updatePositionTouch)
  }
})
</script>
<template>
  <div
    ref="containerRef"
    class="widget-container"
    :class="{
      'is-dragging': position.isDragging,
      'no-select': position.isResizing || position.isDragging,
    }"
    :style="{
      left: `${position.left}px`,
      top: `${position.top}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
    }"
    @mouseup="endResizing"
    @touchend="endResizing"
  >
    <div
      class="header no-select"
      ref="headerRef"
      @touchstart="
        (event) => {
          if (!containerRef) return
          containerRef.addEventListener('touchmove', updatePositionTouch)
          const { left, top } = containerRef.getBoundingClientRect()
          const { x, y, width, height } = containerRef.getBoundingClientRect()
          const { offsetHeight, offsetWidth } = containerRef

          position.startingLeft = left
          position.startingTop = top
          position.touchstartY = event.touches[0].clientY
          position.touchstartX = event.touches[0].clientX
          position.offsetX =
            ((event.touches[0].clientX - x) / width) * offsetWidth
          position.offsetY =
            ((event.touches[0].clientY - y) / height) * offsetHeight +
            event.target.getBoundingClientRect().height

          position.isDragging = true
          position.isResizing = false
        }
      "
      @touchend="
        () => {
          if (!containerRef) return
          containerRef.removeEventListener('touchmove', updatePositionTouch)
          position.startingLeft = null
          position.startingTop = null
          position.touchstartY = null
          position.touchstartX = null
          position.offsetX = null
          position.offsetY = null
          position.isDragging = false
          position.isResizing = false

          emitDragging = false
          emitResizing = false
          emit('dragging', false)
        }
      "
      @mousedown="
        () => {
          if (!containerRef) return
          const rect = containerRef.getBoundingClientRect()
          position.startingLeft = rect.left
          position.startingTop = rect.top
          position.isDragging = true
          position.isResizing = false
        }
      "
      @mouseup="
        () => {
          if (!containerRef) return
          position.startingLeft = null
          position.startingTop = null
          position.isDragging = false
          position.isResizing = false
          emitDragging = false
          emitResizing = false
          emit('dragging', false)
        }
      "
    >
      <div class="header-slot">
        <slot name="header"></slot>
      </div>
      <div class="resize-buttons">
        <button @click="toggleMaximizeWindow" class="resize-button">
          <ImageCollapse v-if="isMaximized && !isMinimized" />
          <ImageExpand v-else />
        </button>
        <button @click="toggleMinimizeWindow" class="resize-button">-</button>
      </div>
    </div>
    <div class="body" :class="{ 'is-minimized': isMinimized }">
      <div
        class="body-slot"
        :class="[
          {
            'no-select': position.isResizing,
          },
          `${dominantDimension}-dominant`,
        ]"
      >
        <slot name="body"></slot>
      </div>
    </div>

    <!-- TODO left/right horizontal resize
     TODO up/down vertical resize
     TODO 4 corners multi-way resize -->
    <div
      class="handle left-handle"
      :class="{ 'is-minimized': isMinimized }"
    ></div>
    <div
      class="handle right-handle"
      :class="{ 'is-minimized': isMinimized }"
    ></div>
    <div
      class="handle top-handle"
      :class="{ 'is-minimized': isMinimized }"
    ></div>
    <div
      class="handle bottom-handle"
      :class="{ 'is-minimized': isMinimized }"
    ></div>

    <div
      class="handle resize-bottom-right"
      :class="{
        'is-resizing': position.isResizing,
        'is-minimized': isMinimized,
      }"
      @mousedown="
        () => {
          position.isDragging = false
          position.isResizing = true
        }
      "
      @mouseup="
        () => {
          position.isDragging = false
          position.isResizing = false

          emitDragging = false
          emitResizing = false
          emit('resizing', false)
        }
      "
      @touchstart="
        (event) => {
          event.target.addEventListener('touchmove', updatePositionTouch)
          position.touchstartY = event.touches[0].clientY
          position.touchstartX = event.touches[0].clientX
          position.isDragging = false
          position.isResizing = true
        }
      "
      @touchend="
        (event) => {
          position.touchstartY = null
          position.touchstartX = null
          event.target.removeEventListener('touchmove', updatePositionTouch)
          position.isResizing = false
          position.isDragging = false

          emitDragging = false
          emitResizing = false
          emit('resizing', false)
        }
      "
    ></div>
  </div>
</template>
<style lang="scss" scoped>
.handle {
  background-color: transparent;
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}
.left-handle {
  grid-area: 2 / 1 / 4 / 2;
}
.right-handle {
  grid-area: 2 / 3 / 4 / 4;
}
.top-handle {
  grid-area: 1 / 2 / 2 / 3;
}
.bottom-handle {
  grid-area: 4 / 2 / 5 / 3;
  display: flex;
  justify-content: end;
  align-items: center;
}

.resize-top-left {
  grid-area: 1 / 1 / 2 / 2;
  cursor: nwse-resize;
}
.resize-top-right {
  grid-area: 1 / 3 / 2 / 4;
  cursor: nesw-resize;
}
.resize-bottom-right {
  grid-area: 4 / 3 / 5 / 4;
  cursor: nwse-resize;
  background-image: url('@/assets/resize.svg');
  background-size: 100%;
}
.resize-bottom-left {
  grid-area: 4 / 1 / 5 / 2;
  cursor: nesw-resize;
}

.no-select {
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}

.is-dragging .header {
  cursor: grabbing;
}

.widget-container {
  grid-area: 4 / 3 / 5 / 4;
  cursor: nwse-resize;
  display: grid;
  overflow-x: clip;
  /*
    12px is the size of the resize handles (which aren't implemented yet/commented out)
    only bottom right is implemented
  */
  grid-template-columns: 12px 1fr 12px;
  grid-template-rows: 12px minmax(min-content, max-content) 1fr 12px;
  grid-column-gap: 0px;
  grid-row-gap: 0px;

  position: absolute;
  z-index: 20;
  background-color: #fff;
  border-radius: 11px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  overflow-y: hidden;
  max-height: 99vh;
  max-width: 99vw;
  @include breakpoint-below('small') {
    max-height: 99vh;
    max-width: 95vw;
  }
}
.body {
  grid-area: 3 / 2 / 4 / 3;
  overflow-y: auto;
}
.body-slot {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}
.overrides {
  padding-top: 18px;
  overflow-y: scroll;
  height: 100%;
}
.header {
  grid-area: 1 / 1 / 3 / 4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: $c-information-blue;
  min-height: 48px;
  cursor: grab;
}

.header-slot {
  font-size: 18px;
  font-weight: 500;
  color: white;
  padding-left: 18px;
}

.header-icon {
  width: 32px;
  height: 32px;
}
.resize-buttons {
  display: flex;
  justify-content: end;
  align-items: end;
}
.resize-button {
  font-weight: 300;
  color: white;
  line-height: 1em;
  font-size: 44px;
  padding: 0 8px;
}

.resize-button :deep(path) {
  fill: white;
}

.is-minimized {
  display: none;
  grid-area: none;
}

.width-dominant {
  width: 100%;
  height: auto;
}
.height-dominant {
  width: auto;
  height: 100%;
}
</style>
