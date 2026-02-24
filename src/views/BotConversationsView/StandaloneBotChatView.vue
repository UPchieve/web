<script setup lang="ts">
import { computed, onBeforeMount, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import ChatBotIcon from '@/assets/chat-bot-icon.svg'
import BotChat from './BotChat.vue'
import TransferToSessionView from '@/views/BotConversationsView/TransferToSessionView/index.vue'
import SystemMessage from '@/views/BotConversationsView/SystemMessage.vue'
import type { RootState } from '@/store'
import { DISPLAY_CONTEXT } from '@/constants/bot-conversations'
import type { Subject, TopicWithSubjects } from '@/types/subjects'

const store = useStore<RootState>()
const route = useRoute()
const router = useRouter()

const selectedTopicId = ref<string>('')
const selectedSubjectId = ref<string>('')
const isLoading = ref(true)

const user = computed(() => store.state.user.user)
const session = computed(() => store.state.user.session)
const conversation = computed(
  () => store.getters['botConversations/currentConversation']
)
const errors = computed(() => store.state.botConversations.errors ?? [])
const isMobileMode = computed(() => store.getters['app/mobileMode'])

const topics = computed<TopicWithSubjects[]>(() => {
  const grouped = store.getters['subjects/subjectsByTopics'] ?? []
  const rawTopics = store.state.subjects.topics ?? []
  // TODO: Use correct type when avaiable
  return grouped.map((groupedTopic: any) => {
    const matchingTopic = rawTopics.find(
      (topic: any) => topic.id === groupedTopic.topicId
    )

    return {
      id: groupedTopic.topicId,
      name: matchingTopic?.name ?? '',
      displayName: matchingTopic?.displayName ?? groupedTopic.topicName,
      subjects: groupedTopic.subjects ?? [],
    }
  })
})

const subjectsById = computed<Record<number, Subject>>(
  () => store.getters['subjects/subjectsById'] ?? {}
)

const currentConversationId = computed(() => conversation.value?.conversationId)

const currentSubject = computed<Subject | undefined>(() => {
  if (conversation.value?.subjectId) {
    return subjectsById.value[conversation.value.subjectId]
  }
  if (!selectedSubjectId.value) return
  return Object.values(subjectsById.value).find(
    (subject) => String(subject.id) === selectedSubjectId.value
  )
})

const currentTopic = computed<TopicWithSubjects | undefined>(() => {
  const topicId = currentSubject.value?.topicId ?? selectedTopicId.value
  if (!topicId) return
  return topics.value.find((topic) => String(topic.id) === String(topicId))
})

const sortedTopics = computed(() =>
  [...topics.value].sort((a, b) => a.displayName.localeCompare(b.displayName))
)

const sortedSubjects = computed(() =>
  [...(currentTopic.value?.subjects ?? [])].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  )
)

const firstName = computed(
  () => user.value?.firstname ?? user.value?.firstName ?? ''
)

const isSelectionShown = computed(() => {
  return (
    !isLoading.value && !currentSubject.value && !currentConversationId.value
  )
})

const isIntroShown = computed(() => {
  return (
    !isLoading.value && !!currentSubject.value && !currentConversationId.value
  )
})

const isChatShown = computed(() => {
  return !isLoading.value && !isSelectionShown.value
})

const isTransferSectionShown = computed(() => {
  return !!currentTopic.value && !!currentSubject.value && !session.value?.id
})

const isChatDisabled = computed(() => {
  return !currentSubject.value || isLoading.value
})

const introMessage = computed(() => {
  if (!currentSubject.value) return ''
  return `You've selected ${currentSubject.value.displayName}! I will now assist you with your questions. Tell me about the problem you need help with.`
})

async function ensureSubjectsLoaded() {
  if (!Object.keys(store.state.subjects.subjects ?? {}).length) {
    await store.dispatch('subjects/getSubjects')
  }

  if (!(store.state.subjects.topics?.length ?? 0)) {
    await store.dispatch('subjects/getTopics')
  }
}

function clearSelectedTopicAndSubject() {
  selectedTopicId.value = ''
  selectedSubjectId.value = ''
}

function applyConversationSubjectToSelection() {
  if (!conversation.value?.subjectId) return

  const subject = subjectsById.value[conversation.value.subjectId]
  if (!subject) return

  selectedTopicId.value = String(subject.topicId)
  selectedSubjectId.value = String(subject.id)
}

async function loadConversationFromRoute() {
  const conversationId = route.params.conversationId as string | undefined
  isLoading.value = true

  if (!conversationId) {
    await store.dispatch('botConversations/resetCurrentConversation')
    clearSelectedTopicAndSubject()
  } else {
    await store.dispatch('botConversations/setConversation', conversationId)
    applyConversationSubjectToSelection()
  }

  isLoading.value = false
}

function selectTopic(topicId: string) {
  selectedTopicId.value = topicId
  selectedSubjectId.value = ''
  store.commit('botConversations/clearErrors')
}

function selectSubject(subjectId: string) {
  selectedSubjectId.value = subjectId
  store.commit('botConversations/clearErrors')
}

async function handleSendMessage(message: string): Promise<boolean> {
  const messageSent = await store.dispatch('botConversations/sendMessage', {
    message,
    displayContext: DISPLAY_CONTEXT.STAND_ALONE,
    subjectId: currentSubject.value?.id,
    source: '',
  })

  const conversationId =
    store.getters['botConversations/currentConversation']?.conversationId

  if (
    messageSent &&
    conversationId &&
    route.params.conversationId !== conversationId
  ) {
    await router.replace({
      name: 'StandaloneBotChat',
      params: { conversationId },
    })
  }

  if (messageSent) {
    applyConversationSubjectToSelection()
  }

  return messageSent
}

onBeforeMount(async () => {
  await ensureSubjectsLoaded()
  await loadConversationFromRoute()
})

onUnmounted(() => {
  store.dispatch('botConversations/resetCurrentConversation')
})

watch(
  () => route.params.conversationId,
  async () => {
    await loadConversationFromRoute()
  }
)

watch(
  () => conversation.value?.subjectId,
  () => {
    applyConversationSubjectToSelection()
  }
)
</script>

<template>
  <div class="standalone">
    <div v-if="isSelectionShown" class="standalone__selection">
      <div class="standalone__greeting">
        <ChatBotIcon class="standalone__avatar" />
        <div>
          <div class="standalone__title">Hey, {{ firstName }}!</div>
          <div class="standalone__subtitle">I'm UPbot, your AI Tutor</div>
        </div>
      </div>

      <div class="standalone__topics">
        <p class="standalone__section-label">
          Select the subject you want help with today
        </p>

        <button
          v-for="topic in sortedTopics"
          :key="String(topic.id)"
          type="button"
          class="standalone__choice"
          :class="{
            'standalone__choice--selected':
              String(topic.id) === selectedTopicId,
          }"
          @click="selectTopic(String(topic.id))"
        >
          {{ topic.displayName }}
        </button>
      </div>

      <div v-if="currentTopic" class="standalone__topics">
        <p class="standalone__section-label">
          What <u>{{ currentTopic.displayName }}</u> topic are you working on?
        </p>

        <button
          v-for="subject in sortedSubjects"
          :key="subject.id"
          type="button"
          class="standalone__choice"
          :class="{
            'standalone__choice--selected':
              String(subject.id) === selectedSubjectId,
          }"
          @click="selectSubject(String(subject.id))"
        >
          {{ subject.displayName }}
        </button>
      </div>
    </div>

    <div v-if="isChatShown" class="standalone__chat">
      <header v-if="currentSubject" class="standalone__chat-header">
        <img
          v-if="currentSubject.topicIconLink"
          :src="currentSubject.topicIconLink"
          :alt="`${currentSubject.displayName} icon`"
          class="standalone__chat-header-icon"
        />
        <h1 class="standalone__chat-header-title">
          {{ currentSubject.displayName }}
        </h1>
      </header>

      <div v-if="isIntroShown" class="standalone__intro">
        <div class="standalone__intro-message">
          <ChatBotIcon class="standalone__intro-avatar" />
          <div class="standalone__intro-content">
            <p class="standalone__intro-text">
              {{ introMessage }}
            </p>
          </div>
        </div>

        <SystemMessage>
          <span>
            You can also switch to a live tutor anytime by clicking on the
            transfer button below.
            <b>
              Keep in mind the UPchieve team monitors messages. Let's keep them
              safe and respectful!
            </b>
          </span>
        </SystemMessage>
      </div>

      <div class="standalone__chat-body">
        <BotChat
          :displayContext="DISPLAY_CONTEXT.STAND_ALONE"
          :sendMessage="handleSendMessage"
          :disabled="isChatDisabled"
        />
      </div>

      <div v-if="errors.length" class="standalone__errors">
        <p
          v-for="(error, index) in errors"
          :key="`${error}-${index}`"
          class="standalone__error"
        >
          {{ error }}
        </p>
      </div>

      <div class="standalone__transfer">
        <p class="standalone__disclaimer">
          AI may not always be accurate.
          <span v-if="isTransferSectionShown">
            For more help, transfer to a live tutor!
          </span>
        </p>
        <TransferToSessionView
          v-if="isTransferSectionShown"
          :topic="currentTopic?.name ?? ''"
          :subject="currentSubject?.name ?? ''"
          :isMobileMode="isMobileMode"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.standalone {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  padding: 1em 1em 2em;

  &__selection {
    width: 100%;
    margin: 0 auto;
  }

  &__greeting {
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 24px;
    width: 100%;
    margin: 0 auto;
  }

  &__avatar {
    width: 80px;
    height: 80px;
  }

  &__title {
    font-size: 32px;
    font-weight: 500;
  }

  &__subtitle {
    font-size: 24px;
    font-weight: 400;
  }

  &__topics {
    width: 100%;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto;
    row-gap: 16px;
    column-gap: 16px;

    @include breakpoint-below('medium') {
      grid-template-columns: repeat(1, 1fr);
    }
  }

  &__section-label {
    margin: 0;
    grid-column: -1 / 1;
    padding-top: 16px;
  }

  &__choice {
    padding: 13px 18px;
    background-color: white;
    border-radius: 4px;
    border: 1px solid $border-grey;

    &--selected {
      border-color: $c-success-green;
      background-color: $selected-green;
    }
  }

  &__chat {
    display: flex;
    flex-direction: column;
    height: 100%;
    width: 70%;
    margin: 0 auto;
  }

  &__chat-header {
    @include flex-container(row, center, center);
    margin-bottom: 1em;
  }

  &__chat-header-icon {
    width: 48px;
    height: 48px;
  }

  &__chat-header-title {
    @include font-category('display-small');
    margin-bottom: 0;
    margin-left: 0.4em;
  }

  &__intro {
    width: 100%;
  }

  &__intro-message {
    display: flex;
    align-items: flex-start;
    justify-content: start;
    gap: 24px;
    width: 100%;
    margin: 0 auto;
    padding: 16px 0;
  }

  &__intro-avatar {
    width: 30px;
    height: 30px;
    flex-shrink: 0;
  }

  &__intro-content {
    min-width: 0;
  }

  &__intro-text {
    margin: 0;
  }

  &__chat-body {
    flex: 1;
    min-height: 0;
  }

  &__errors {
    padding: 8px 0;
  }

  &__error {
    margin: 0;
    color: $c-error-red;
    font-size: 14px;
  }

  &__transfer {
    // composer → disclaimer → button form a single grouped block. The
    // composer's own bottom padding handles its visual gap above the
    // disclaimer, so no padding-top here. Button gets a bit more
    // breathing from the disclaimer than the disclaimer gets from the
    // composer, so the eye reads disclaimer as belonging to the chat
    // above and the button as the next step.
    display: flex;
    flex-direction: column;
    align-items: center;
    row-gap: 1em;
  }

  &__disclaimer {
    text-align: center;
    color: $c-default-grey;

    @include breakpoint-below('medium') {
      font-size: 12px;
    }
  }
}
</style>
