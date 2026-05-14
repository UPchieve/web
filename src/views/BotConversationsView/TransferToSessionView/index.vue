<script lang="ts" setup>
import TransferToSessionButton from '@/views/BotConversationsView/TransferToSessionView/TransferToSessionButton.vue'
import SubjectSelectionModal from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal.vue'
import { useStore } from 'vuex'
import { computed } from 'vue'

const store = useStore()

const props = defineProps<{
  topic: string
  subject: string
  isMobileMode: boolean
}>()

const currentConversationId = computed(
  () => store.state.botConversations.currentConversation?.conversationId
)

const cooldownMinutes = computed(
  () => store.getters['session/sessionRequestCooldownMinutes']
)

const showPresessionSurvey = () => {
  if (currentConversationId.value) {
    store.commit(
      'botConversations/setPendingTransferredConversationId',
      currentConversationId.value
    )
  }

  store.dispatch('app/modal/show', {
    // Hack for now: Render the SubjectSelectionModal in the state _after_ the topic is selected
    // (The presession survey step)
    component: SubjectSelectionModal,
    data: {
      preSelectedSubtopic: props.subject,
      topic: props.topic,
    },
  })
}
</script>

<template>
  <div class="transfer-to-session">
    <TransferToSessionButton
      :onClick="showPresessionSurvey"
      :disable-button="cooldownMinutes"
    />
  </div>
</template>

<style lang="scss" scoped>
.transfer-to-session {
  display: flex;
  flex-direction: column;
  text-align: center;
  gap: 8px;
  align-items: center;
}
</style>
