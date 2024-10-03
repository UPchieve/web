<script setup lang="ts">
import { useStore } from 'vuex'
import { computed, onBeforeMount, ref, watch } from 'vue'
import SelectTopic from './SelectTopic.vue'
import { useRouter } from 'vue-router'
import Textarea from './Textarea.vue'
import LoggerService from '@/services/LoggerService'
import ModerationService from '@/services/ModerationService'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'

export type Subject = Partial<{ id: number; displayName: string }>

const store = useStore()
const router = useRouter()
let currentSubject = ref()

const sessionId = computed(() => store.state.user.session.id)
onBeforeMount(async () => {
  if (sessionId.value) {
    store.dispatch('app/header/show', { component: 'RejoinSessionHeader' })
  }
  await store.dispatch('botConversations/fetchAllSubjects')
})
watch(
  () => store.state.botConversations.currentConversation?.conversationId,
  async (current) => {
    if (current) {
      const navFailure = await router.push(`/ai-tutor-conversations/${current}`)
      if (navFailure) {
        LoggerService.noticeError(navFailure, {
          message: 'NewBotChat failed to redirect to conversation',
          current,
        })
      }
    }
  }
)

const subjects = computed(() => store.state.botConversations.subjects)
const fetchingConversation = computed(
  () => store.state.botConversations.isFetchingConversation
)

const selectSubject = (subject: Subject) => {
  currentSubject.value = subject
  AnalyticsService.captureEvent(EVENTS.AI_TUTOR_SUBJECT_SELECTED)
}

const sendFirstMessage = async (message: string) => {
  store.commit('botConversations/clearErrors')
  const isClean = await ModerationService.checkIfMessageIsClean({
    message,
    sessionId: undefined,
  })
  if (isClean) {
    await store.dispatch('botConversations/createConversation', {
      message,
      subjectId: currentSubject.value.id,
    })
  } else {
    store.commit(
      'botConversations/setError',
      'Messages cannot contain personal information, profanity, or links to third party video services'
    )
  }
  return isClean
}
</script>

<template>
  <div class="container">
    <SelectTopic
      :subjects="subjects"
      :subject="currentSubject"
      :selectSubject="selectSubject"
      :firstName="store.getters['user/firstName']"
    />

    <div class="chat-log">
      <div class="typing-indicator" v-if="fetchingConversation">
        Creating chat
      </div>
    </div>
    <span class="notice" v-if="currentSubject?.displayName">
      The UPchieve team monitors messages - let's keep them safe and respectful!
    </span>
    <div class="text-area-container">
      <Textarea
        v-if="currentSubject?.displayName"
        class="textarea"
        :placeholder="`How can UPbot help you with ${currentSubject.displayName} today?`"
        :disabled="!currentSubject || fetchingConversation"
        :sendMessage="(message: string) => sendFirstMessage(message)"
      ></Textarea>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  padding-top: 10vh;
  row-gap: 18px;
  height: 100%;
  max-width: 768px;
}

.text-area-container {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 36px;
  margin-left: auto;
  margin-right: auto;
  background-color: #fbfbfc;
}
.notice {
  align-self: start;
}
.chat-log {
  flex-shrink: 0;
  min-height: 24px;
  display: flex;
  align-items: center;
  align-self: start;
}

.textarea {
  width: 100%;
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
</style>
