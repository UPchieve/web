<script lang="ts" setup>
import { ref } from 'vue'
import RecordIcon from '@/assets/voice_message_icons/record-message.svg'

const showAnnouncement = ref(
  JSON.parse(localStorage.getItem('showVmAnnouncement') ?? 'true')
)
function close() {
  showAnnouncement.value = false
  localStorage.setItem('showVmAnnouncement', JSON.stringify(false))
}
</script>

<template>
  <div v-if="showAnnouncement" class="announcement">
    <div class="header">
      <div class="top">
        <span class="beta">New Beta Feature!</span>
        <button class="close" @click="close">+</button>
      </div>
      <span class="title"
        >Audio Recording! <RecordIcon class="mic"></RecordIcon>
      </span>
    </div>
    <div class="body">
      Exciting news! We're experimenting with audio messages in the chat,
      available to a select group. Try it out today!
    </div>
  </div>
</template>

<style scoped lang="scss">
.announcement {
  background-color: white;
  box-shadow:
    3px 3px 3px $c-shadow-header,
    3px -3px 3px $c-shadow-header,
    -3px -3px 3px $c-shadow-header,
    -3px 3px 3px $c-shadow-header;
  position: absolute;
  z-index: 9;
  padding: 8px;
  border-radius: 12px;
  bottom: 60px;
  right: 8px;
  width: 240px;

  @include breakpoint-below('medium') {
    bottom: 90px;
  }
}

.header {
  padding: 4px;
  border-bottom: 1px solid lightgray;
}

.main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.beta {
  font-size: 14px;
  color: lightslategray;
}
.mic::v-deep path {
  fill: rgb(52, 52, 64);
}
.title {
  font-size: 16px;
  font-weight: 500;
}
.close {
  font-size: 30px;
  font-weight: 300;
  transform: rotate(45deg);
  color: black;
}
.body {
  font-size: 14px;
  padding: 4px;
  font-weight: 500;
}
</style>
