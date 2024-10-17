<script lang="ts">
export default {
  name: 'TransferToSessionView',
}
</script>

<script lang="ts" setup>
import TransferToSessionButton from '@/views/BotConversationsView/TransferToSessionView/TransferToSessionButton.vue'
import SubjectSelectionModal from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal.vue'
import { useStore } from 'vuex'
import { computed } from 'vue'
import { DISPLAY_CONTEXT } from '@/views/BotConversationsView/BotChat.vue'

const store = useStore()

const props = defineProps<{
  topic: string
  subject: string
  displayContext: DISPLAY_CONTEXT
  isMobileMode: boolean
}>()

const currentConversationId = computed(
  () => store.state.botConversations.currentConversation?.conversationId
)

const cooldownMinutes = computed(
  () => store.getters['session/sessionRequestCooldownMinutes']
)

const showPresessionSurvey = () => {
  store.dispatch('app/modal/show', {
    // Hack for now: Render the SubjectSelectionModal in the state _after_ the topic is selected
    // (The presession survey step)
    component: SubjectSelectionModal,
    data: {
      preSelectedSubtopic: props.subject,
      topic: props.topic,
      // If there is a current conversation, pass it to the session args
      ...(currentConversationId.value
        ? { sessionArgs: { tutorBotConversationId: currentConversationId } }
        : {}),
    },
  })
}
</script>

<template>
  <div class="transfer-to-session">
    <span
      class="ai-disclaimer"
      v-if="displayContext === DISPLAY_CONTEXT.STAND_ALONE"
      >AI may not always be accurate. For more help, transfer to a live
      tutor!</span
    >
    <TransferToSessionButton
      :onClick="showPresessionSurvey"
      :disable-button="cooldownMinutes"
    />
  </div>
</template>

<style lang="scss" scoped>
.ai-disclaimer {
  color: $c-default-grey;
  @include breakpoint-below('medium') {
    font-size: 12px;
  }
}

.transfer-to-session {
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 8px;
  align-items: center;
}
</style>
