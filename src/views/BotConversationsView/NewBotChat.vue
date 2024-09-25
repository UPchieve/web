<script setup lang="ts">
import { useStore } from 'vuex'
import { computed, onBeforeMount, ref, watch } from 'vue'
import SelectTopic from './SelectTopic.vue'
import { useRouter } from 'vue-router'
import Textarea from './Textarea.vue'
import LoggerService from '@/services/LoggerService'

export type Subject = Partial<{ id: number; displayName: string }>

const store = useStore()
const router = useRouter()
let currentSubject = ref()

onBeforeMount(async () => {
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
}

const sendFirstMessage = async (message: string) => {
  await store.dispatch('botConversations/createConversation', {
    message,
    subjectId: currentSubject.value.id,
  })
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
