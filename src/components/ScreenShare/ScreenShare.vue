<script setup lang="ts">
import { onMounted, ref, computed, nextTick, watch } from 'vue'
import ImageExpand from '@/assets/image-expand.svg'
import ImageCollapse from '@/assets/image-collapse.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import { useActor } from '@xstate/vue'
import { machine } from './screen-share-component-machine'
import { create } from '@/state-machines/meeting-machine'
import { onUnmounted } from 'vue'
import { debounce } from 'lodash-es'

const DEFAULT_WIDTH = 300
const DEFAULT_HEIGHT = 300
const HANDLE_SIZE = 10

const emit = defineEmits(['dragging', 'resizing'])
const props = defineProps<{
  firstName: string
  isViewingPartnerScreenShare: boolean
  meetingActor: ReturnType<typeof useActor<ReturnType<typeof create>>>
  screenShareWidth?: number
  screenShareHeight?: number
  screenShareActive: boolean
}>()

const meetingVideo = ref<HTMLVideoElement>()
const screenShareWindow = ref()

const x = ref(HANDLE_SIZE)
const y = ref(HANDLE_SIZE)
const parentWidth = ref()
const parentHeight = ref()
const manualWidth = ref<number | null>(null)
const manualHeight = ref<number | null>(null)

/*
  This is annoying but needed to deal with some quirks in the vue-draggable-resizable component.
  manualWidth is only set once the video is loaded and the user has resized the window.
  otherwise, it returns the screenShareWidth from the Chime event.
  If that is not set, it returns the default width.
*/
const width = computed(() => {
  if (manualWidth.value) {
    return manualWidth.value
  }
  if (meetingVideo.value) {
    return Math.max(
      props.screenShareWidth ?? 0,
      meetingVideo.value?.offsetWidth ?? 0
    )
  } else if (props.screenShareWidth) {
    return props.screenShareWidth
  } else {
    return DEFAULT_WIDTH
  }
})
const height = computed(() => {
  if (manualHeight.value) {
    return manualHeight.value
  }
  if (meetingVideo.value) {
    return Math.max(
      props.screenShareHeight ?? 0,
      meetingVideo.value?.offsetHeight ?? 0
    )
  } else if (props.screenShareHeight) {
    return props.screenShareHeight
  } else {
    return DEFAULT_HEIGHT
  }
})

function forceParentRecalculation(w, h) {
  parentWidth.value = w - HANDLE_SIZE * 2
  parentHeight.value = h - HANDLE_SIZE * 2
  // NOTE: lol, i want to write a draggable-resizable library so bad after this
  // https://github.com/mauricius/vue-draggable-resizable/issues/133#issuecomment-446781986
  window.dispatchEvent(new Event('resize'))
}

const maybeForceParentRecalculation = debounce(() => {
  const [w, h] = screenShareWindow.value.getParentSize()
  if (
    w - HANDLE_SIZE * 2 !== parentWidth.value ||
    h - HANDLE_SIZE * 2 !== parentHeight.value
  ) {
    forceParentRecalculation(w, h)
  }
}, 500)

// for expanding the screenshare window to maximum size
onMounted(() => {
  props.meetingActor.send({
    type: 'video_ui_loaded',
    videoOutputElement: meetingVideo.value!,
  })

  // Hack to get the initial parent size so we can resize the window to the edges
  const [w, h] = screenShareWindow.value.getParentSize()
  forceParentRecalculation(w, h)
  window.addEventListener('resize', maybeForceParentRecalculation)
})

const windowHeader = ref()
const windowContent = ref()

const options = {
  input: {
    isViewingPartnerScreenShare: props.isViewingPartnerScreenShare,
    width: width.value,
    height: height.value,
    x: x.value,
    y: y.value,
    maximize: () => {
      /*
        NOTE: we have to call some vue-draggable-resizable internals manually
        to get the correct max sizes. particularly after a the window is resized.
        without this, we'd only ever the the parent size of the inital window.

        source: https://github.com/mauricius/vue-draggable-resizable/blob/main/src/components/vue-draggable-resizable.vue
      */
      const [parentWidth, parentHeight] =
        screenShareWindow.value.getParentSize()

      /* move the component to the top left corner */
      x.value = HANDLE_SIZE
      y.value = HANDLE_SIZE

      /*
        this triggers some internal vue-draggable-resizable internal computation
        and sets the height, width, and some bounds.
      */
      manualHeight.value = parentHeight - HANDLE_SIZE * 2
      manualWidth.value = parentWidth - HANDLE_SIZE * 2
      nextTick(() => {
        /*
          now here's the final hack; we need to manually set the width and height again,
          otherwise computed values are not updated.
          this has to happen after the nextTick,
          otherwise the computed values are updated too early.
        */
        screenShareWindow.value.changeWidth(width.value)
        screenShareWindow.value.changeHeight(height.value)
      })
    },
    minimize: () => {
      /*
        this triggers some internal vue-draggable-resizable internal computation
        and sets the height, width, and some bounds.
      */
      manualWidth.value = DEFAULT_WIDTH
      manualHeight.value = windowHeader.value.offsetHeight
      nextTick(() => {
        /*
          we need to manually set the width and height again,
          otherwise computed values are not updated.
          this has to happen after the nextTick,
          otherwise the computed values are updated too early.
        */
        screenShareWindow.value.changeWidth(width.value)
        screenShareWindow.value.changeHeight(height.value)
      })
      AnalyticsService.captureEvent(
        EVENTS.SCREENSHARE_USER_MINIMIZED_SCREENSHARE
      )
    },
    resize: ({
      width: w,
      height: h,
      x: userX,
      y: userY,
    }: {
      width: number
      height: number
      x: number
      y: number
    }) => {
      manualWidth.value = w
      manualHeight.value = h
      x.value = userX
      y.value = userY
      nextTick(() => {
        /*
          we need to manually set the width and height again,
          otherwise computed values are not updated.
          this has to happen after the nextTick,
          otherwise the computed values are updated too early.
        */
        screenShareWindow.value.changeWidth(width.value)
        screenShareWindow.value.changeHeight(height.value)
      })
    },
  },
}
const windowMachine = useActor(machine, options)

/*
  It looks like zwibbler does not propagate `mousedown` events from their canvas.
  vue-draggable-resizable uses mousedown events to determine if the component should be unfocused.
  Zwibbler allows `click` events to propagate, so we use that to unfocus the component.
  So, we must manually unfocus the component (to hide the handles) when the user clicks on the canvas.

  START UNFOCUS HACK
*/
const isFocused = ref(false)
const unfocus = () => {
  isFocused.value = false
}

const auxiliaryContainer = document.querySelector('#auxiliary-container')
auxiliaryContainer?.addEventListener('click', unfocus)
onUnmounted(() => {
  window.removeEventListener('resize', maybeForceParentRecalculation)
  auxiliaryContainer?.removeEventListener('click', unfocus)
})
/* END UNFOCUS HACK */

watch(
  () => props.screenShareActive,
  (isActive) => {
    if (isActive) {
      // We need to force a recalculation of the sizes once the video is loaded.
      // Toggling maximize is the easiest way (and we want it to be maxed for students)
      // We toggle twice for volunteers as a small hack to ensure the video content is correctly containted
      nextTick(() => {
        windowMachine.send({ type: 'toggleMaximize' })
        if (!props.isViewingPartnerScreenShare) {
          nextTick(() => {
            windowMachine.send({ type: 'toggleMaximize' })
          })
        }
      })
    }
  }
)
</script>

<template>
  <vue-draggable-resizable
    ref="screenShareWindow"
    :active="isFocused"
    @mousedown="isFocused = true"
    :y="y"
    :x="x"
    class="window"
    :class="{ closed: windowMachine.snapshot.value.matches('Minimized') }"
    :lock-aspect-ratio="false"
    :parent="true"
    :z="10"
    @resizing="
      () => {
        emit('resizing', true)
      }
    "
    @resizeStop="
      (x: number, y: number, w: number, h: number) => {
        emit('resizing', false)
        manualWidth = w
        manualHeight = h

        windowMachine.send({
          type: 'resized',
          width: width!,
          height: height!,
          x,
          y,
        })
      }
    "
    @dragging="
      () => {
        emit('dragging', true)
      }
    "
    @dragStop="
      (newX: number, newY: number) => {
        emit('dragging', false)
        x = newX
        y = newY
        windowMachine.send({
          type: 'moved',
          x: newX,
          y: newY,
        })
      }
    "
    :class-name-active="'active'"
    :class-name-dragging="'dragging'"
    :min-width="DEFAULT_WIDTH"
    :h="height"
    :w="width"
    :max-width="parentWidth"
    :max-height="parentHeight"
  >
    <div class="window-header" ref="windowHeader">
      {{ props.firstName }}'s screen
      <div class="resize-buttons">
        <button
          type="button"
          @click="() => windowMachine.send({ type: 'toggleMaximize' })"
          class="resize-button"
        >
          <ImageCollapse
            v-if="windowMachine.snapshot.value.matches('Maximized')"
          />
          <ImageExpand v-else />
        </button>
        <button
          type="button"
          @click="() => windowMachine.send({ type: 'toggleMinimize' })"
          class="resize-button"
          :class="
            windowMachine.snapshot.value.matches('Minimized') ? 'plus' : 'minus'
          "
        >
          {{ windowMachine.snapshot.value.matches('Minimized') ? '+' : '-' }}
        </button>
      </div>
    </div>
    <div
      class="window-content"
      v-show="!windowMachine.snapshot.value.matches('Minimized')"
      ref="windowContent"
    >
      <video
        :height="
          screenShareWindow?.height
            ? screenShareWindow.height - (windowHeader?.offsetHeight ?? 0)
            : 'auto'
        "
        :width="screenShareWindow?.width ? screenShareWindow.width : 'auto'"
        ref="meetingVideo"
      ></video>
    </div>
  </vue-draggable-resizable>
</template>

<style scoped lang="scss">
video,
canvas {
  max-width: 100%;
  max-height: 98%;
  padding-top: 2%;
}

.window {
  background: $c-background-grey;
  display: block;
  cursor: grab;
  box-shadow:
    0px 4px 4px 0px rgba(0, 0, 0, 0.25),
    -1px -1px 4px 0px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
  border-width: 0;
  position: absolute;
}

.dragging {
  cursor: grabbing;
}

.window-header {
  grid-area: 1 / 1 / 3 / 4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: $c-information-blue;
  min-height: 48px;
  font-size: 18px;
  font-weight: 500;
  color: white;
  padding-left: 12px;
  padding-right: 12px;
  border-radius: 8px 8px 0 0;
}

.closed .window-header {
  border-radius: 8px;
}

.resize-buttons {
  display: flex;
  justify-content: end;
  align-items: center;
  flex-shrink: 0;
}

.resize-button {
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  font-weight: 300;
  line-height: 1em;
  font-size: 44px;
  width: 30px;
  padding: 0;
  height: 44px;
}

.resize-button :deep(path) {
  fill: white;
}

.plus {
  font-size: 32px;
}

.minus {
  padding-bottom: 4px;
  font-weight: 200;
}

.resize-handle {
  position: absolute;
  border-radius: 50%;
  width: 10px;
  height: 10px;
  border: 1px solid white;
}

:deep(.handle) {
  border-radius: 50%;
  background-color: white;
}
</style>
