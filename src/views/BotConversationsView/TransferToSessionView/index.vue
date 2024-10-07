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

const store = useStore()

const props = defineProps<{
  subject: 'math'
  topic: string
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
      preSelectedSubtopic: props.topic,
      topic: props.subject,
      // If there is a current conversation, pass it to the session args
      ...(currentConversationId.value
        ? { sessionArgs: { tutorBotConversationId: currentConversationId } }
        : {}),
    },
  })
}
</script>

<template>
  <div>
    <TransferToSessionButton
      :onClick="showPresessionSurvey"
      :disable-button="cooldownMinutes"
    />
  </div>
</template>

<style lang="scss" scoped></style>
