<script lang="ts" setup>
import BotChat from '@/views/BotConversationsView/BotChat.vue'
import { DISPLAY_CONTEXT } from '@/constants/bot-conversations'
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useStore } from 'vuex'
import Errors from '@/views/BotConversationsView/Errors.vue'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

const emit = defineEmits<{
  (e: 'minimize'): void
  (e: 'dragging', v: boolean): void
  (e: 'resizing', v: boolean): void
}>()
const store = useStore()
const isMobileMode = computed(() => store.getters['app/mobileMode'])
const isVolunteer = computed(() => store.getters['user/isVolunteer'])

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
watch(isMobileMode, (current) => {
  if (current) {
    position.top = SMALL_SCREEN.top
    position.left = SMALL_SCREEN.left
  }
})
const emitDragging = ref(false)
const emitResizing = ref(false)
function updatePosition(event) {
  requestAnimationFrame(() => {
    event.stopPropagation()
    event.stopImmediatePropagation()
    event.preventDefault()
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
    }
    if (event.which === 1 && position.isResizing) {
      const newWidth = event.movementX + position.width
      const newHeight = event.movementY + position.height
      position.width =
        newWidth < MIN_DIMENSIONS.width ? MIN_DIMENSIONS.width : newWidth
      position.height =
        newHeight < MIN_DIMENSIONS.height ? MIN_DIMENSIONS.height : newHeight
      // Only emit once. this needs to be in mousemove otherwise we count click as a resize
      if (!emitResizing.value) {
        emitResizing.value = true
        emit('resizing', true)
      }
    }
  })
}
function updatePositionTouch(event) {
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
      }
      if (position.isResizing) {
        // Only emit once. this needs to be in touchmove otherwise we count touchstart as a resize
        if (!emitResizing.value) {
          emitResizing.value = true
          emit('resizing', true)
        }
        const moveX = touch.clientX - position.touchstartX
        const newWidth = moveX + position.width
        const moveY = touch.clientY - position.touchstartY
        position.touchstartX = touch.clientX
        position.touchstartY = touch.clientY
        const newHeight = moveY + position.height
        position.width =
          newWidth < MIN_DIMENSIONS.width ? MIN_DIMENSIONS.width : newWidth
        position.height =
          newHeight < MIN_DIMENSIONS.height ? MIN_DIMENSIONS.height : newHeight
      }
    })
  }
}

async function handleSendMessage(message: string): Promise<boolean> {
  return store.dispatch('botConversations/sendMessage', {
    message,
    displayContext: DISPLAY_CONTEXT.SESSION,
    source: '',
  })
}

onMounted(() => {
  addEventListener('mousemove', updatePosition)
  const currentConversation =
    store.getters['botConversations/currentConversation']

  // Only add this notice once.
  // This will need to be rewritten if we use `system` for anything else
  if (
    'messages' in currentConversation &&
    !currentConversation.messages.some(
      (m: { senderUserType: string }) => m.senderUserType === 'system'
    )
  ) {
    const studentMessage =
      '<b>Heads up!</b> Your tutor can now see our chat and ask me questions too. Feel free to keep asking me questions, even while chatting with your tutor.'
    const volunteerMessage =
      '<b>Heads up!</b> Your student can see our chat and ask me questions too. Feel free to ask me questions, even while chatting with your student.'
    const message = isVolunteer.value ? volunteerMessage : studentMessage
    store.commit('botConversations/addToCurrentConversation', {
      senderUserType: 'system',
      message,
    })
  }
  AnalyticsService.captureEvent(EVENTS.AI_TUTOR_WIDGET_SEEN)
})

onUnmounted(() => {
  removeEventListener('mousemove', updatePosition)
})
</script>
<template>
  <div
    ref="containerRef"
    class="widget-container"
    :class="{ 'is-dragging': position.isDragging }"
    :style="{
      left: `${position.left}px`,
      top: `${position.top}px`,
      width: `${position.width}px`,
      height: `${position.height}px`,
    }"
  >
    <div
      class="header"
      @touchstart="
        (event) => {
          if (!containerRef || isMobileMode) return
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
          if (!containerRef || isMobileMode) return
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
          if (!containerRef || isMobileMode) return
          const rect = containerRef.getBoundingClientRect()
          position.startingLeft = rect.left
          position.startingTop = rect.top
          position.isDragging = true
          position.isResizing = false
        }
      "
      @mouseup="
        () => {
          if (!containerRef || isMobileMode) return
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
      <span class="header-title">
        <ChatBotIcon class="header-icon"></ChatBotIcon>
        UPBot</span
      >
      <button type="button" @click="() => emit('minimize')" class="minimize">
        -
      </button>
    </div>
    <div class="body">
      <Errors />
      <BotChat
        class="overrides"
        :displayContext="DISPLAY_CONTEXT.SESSION"
        :sendMessage="handleSendMessage"
      />

      <div class="resize-handle-container">
        <div
          class="resize-handle"
          :class="{ 'is-resizing': position.isResizing }"
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
              if (isMobileMode) return
              event.target.addEventListener('touchmove', updatePositionTouch)
              position.touchstartY = event.touches[0].clientY
              position.touchstartX = event.touches[0].clientX
              position.isDragging = false
              position.isResizing = true
            }
          "
          @touchend="
            (event) => {
              if (isMobileMode) return
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
    </div>
  </div>
</template>
<style lang="scss" scoped>
* {
  --header-height: 48px;
}
.resize-handle-container {
  display: flex;
  justify-content: end;
  align-items: center;
  margin-top: -24px;
  height: 24px;
  position: relative;
}
.resize-handle {
  background-color: transparent;
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
  width: 24px;
  height: 24px;
  cursor: nwse-resize;
}

.is-dragging {
  -moz-user-select: -moz-none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  user-select: none;
}

.is-dragging .header {
  cursor: grabbing;
}

.widget-container {
  position: absolute;
  z-index: 20;
  background-color: #fff;
  border-radius: 11px;
  box-shadow: 0px 4px 4px 0px rgba(0, 0, 0, 0.25);
  overflow-y: auto;
  padding-top: var(--header-height);
  max-height: 80vh;
  max-width: 80vw;
  @include breakpoint-below('small') {
    max-height: 70vh;
    max-width: 95vw;
  }
}
.body {
  height: 100%;
  position: relative;
}
.overrides {
  height: 100%;
  padding-left: 1em;
  padding-right: 1em;
  padding-top: 1em;
}
.header {
  position: absolute;
  top: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: $c-information-blue;
  cursor: grab;
}

.header-title {
  font-size: 18px;
  font-weight: 500;
  color: white;
  padding-left: 18px;
}

.header-icon {
  width: 32px;
  height: 32px;
}

.minimize {
  font-size: var(--header-height);
  font-weight: 300;
  color: white;
  line-height: 1em;
  padding: 0 18px;
}
</style>
