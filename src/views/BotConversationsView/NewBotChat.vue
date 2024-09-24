<script setup lang="ts">
import { useStore } from 'vuex'
import { computed, ref } from 'vue'
import SelectTopic from './SelectTopic.vue'
import { useRouter } from 'vue-router'
import Textarea from './Textarea.vue'
// import Logout from '@/assets/logout.svg'

export type Subject = Partial<{ id: number; displayName: string }>

const store = useStore()
const router = useRouter()
const subjects = computed(() => store.state.botConversations.subjects)
let currentSubject = ref()

const selectSubject = (subject: Subject) => {
  currentSubject.value = subject
}

const fetchingConversation = computed(
  () => store.state.botConversations.isFetchingConversation
)

const sendFirstMessage = async (message: string) => {
  const conversationId = await store.dispatch(
    'botConversations/createConversation',
    {
      message,
      subjectId: currentSubject.value.id,
    }
  )
  router.push(`/ai-tutor-conversations/${conversationId}`)
}
</script>

<template>
  <div class="container">
    <!-- comment out for v1 -->
    <!-- <div class="exit-button">
      <button @click="() => router.push('/dashboard')">
        <Logout class="exit"></Logout>
        Exit AI session
      </button>
    </div> -->
    <SelectTopic
      :subjects="subjects"
      :subject="currentSubject"
      :selectSubject="selectSubject"
      :firstName="store.getters['user/firstName']"
    />

    <div class="row chat-log">
      <div class="typing-indicator" v-if="fetchingConversation">
        Creating chat
      </div>
    </div>

    <Textarea
      class="row"
      :disabled="!currentSubject || fetchingConversation"
      :sendMessage="(message: string) => sendFirstMessage(message)"
    ></Textarea>

    <!--
    <div class="row request-tutor">
      <LargeButton>Request a tutor to join</LargeButton>
    </div> -->
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px;
  row-gap: 24px;
  max-height: 80vh;
}

.row {
  width: 100%;
  margin: 0 auto;
}

.title {
  font-size: 32;
  font-weight: 500;
}

.sub-title {
  font-size: 24;
  font-weight: 400;
}

.chat-log {
  flex-grow: 1;
  max-height: 200px;
  align-items: end;
}
.chat textarea {
  width: 100%;
  height: 8em;
  border-radius: 11px;
  border: 1px solid $border-grey;
  padding: 18px;
}

.request-tutor {
  align-content: center;
  justify-content: center;
}
.typing-indicator {
  text-align: left;
  width: 100%;
}
.typing-indicator:after {
  overflow: hidden;
  display: inline-block;
  vertical-align: bottom;
  -webkit-animation: ellipsis steps(4, end) 900ms infinite;
  animation: ellipsis steps(4, end) 900ms infinite;
  content: '\2026'; /* ascii code for the ellipsis character */
  width: 0px;
}

@keyframes ellipsis {
  to {
    width: 1.25em;
  }
}

@-webkit-keyframes ellipsis {
  to {
    width: 1.25em;
  }
}
.exit-button {
  width: 100%;
  display: flex;
  justify-content: end;
  align-items: center;
}
.exit {
  width: 21px;
  height: 21px;
  transform: rotate(180deg);
}
</style>
