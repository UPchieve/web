<script lang="ts" setup>
import LargeButton from '@/components/LargeButton.vue'
import Modal from '@/components/Modal.vue'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import { onMounted } from 'vue'

const { closeModal, isVolunteer } = defineProps<{
  closeModal: () => void
  isVolunteer: boolean
}>()
onMounted(() => {
  localStorage.setItem('seen-ai-assisted-modal', 'true')
})
</script>

<template>
  <Modal class="modal" :closeModal="closeModal">
    <div class="ai-assist">
      <header class="header" h>
        <chat-bot-icon class="avatar" />
      </header>
      <main class="main">
        <div class="title">Welcome to AI-Assisted Tutoring with UPbot</div>
        <ol v-if="isVolunteer">
          <li>
            See the Chat:
            <span class="item"
              >Review the student’s conversation with the AI to get up to
              speed.</span
            >
          </li>
          <li>
            Support Together:
            <span class="item"
              >The AI assists, but your guidance is essential!</span
            >
          </li>
          <li>
            Ask the AI:
            <span class="item"
              >Feel free to ask the AI for practice problems or
              explanations.</span
            >
          </li>
        </ol>
        <ol v-else>
          <li>
            Work Together:
            <span class="item"
              >You and your tutor can chat with the AI together.</span
            >
          </li>
          <li>
            Ask the AI:
            <span class="item"
              >Feel free to ask the AI for practice problems or
              explanations.</span
            >
          </li>
        </ol>
      </main>
      <footer class="footer">
        <LargeButton class="button" @click="closeModal">Got it!</LargeButton>
      </footer>
    </div>
  </Modal>
</template>

<style lang="scss" scoped>
:deep(.upc-modal-form),
:deep(.upc-modal-form--bottom-padding) {
  padding: 0;
  border-radius: 40px;
}
.ai-assist {
  display: flex;
  flex-direction: column;
  padding-top: 40px;
}
.header {
  background: linear-gradient(0deg, $selected-green 50%, #fff 0%);
}
.avatar {
  height: 90px;
  width: 90px;
}

.main {
  background-color: $selected-green;
  padding: 14px 40px;
  ol {
    padding-left: 20px;
  }
  li {
    padding-top: 7px;
    line-height: 140%;
    font-weight: 600;
    font-size: 20px;
    text-align: left;
  }
  .item {
    font-weight: 400;
  }
}
.title {
  font-size: 25px;
  font-weight: 500;
  text-align: left;
  line-height: 125%;
  padding-bottom: 10px;
}

.button {
  background-color: $c-information-blue;
  color: white;
  border-width: 0;
  min-width: 30%;
  &:hover {
    background: darken($c-information-blue, 5%);
  }
}

.footer {
  background-color: $selected-green;
  padding-bottom: 40px;
}
</style>
