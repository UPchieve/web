<script lang="ts" setup>
import TransferToSessionButton from '@/views/BotConversationsView/TransferToSessionView/TransferToSessionButton.vue'
import SubjectSelectionModal from '@/views/DashboardView/StudentDashboard/SubjectSelection/SubjectSelectionModal.vue'
import { useStore } from 'vuex'
import { computed } from 'vue'
import TutorIcon from '@/assets/icons/graduation_cap_icon.svg'

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

const isAsyncEssayReviewEnabled = computed(
  () => store.getters['featureFlags/isAsyncEssayReviewEnabled']
)

const showPresessionSurvey = () => {
  if (currentConversationId.value) {
    store.commit(
      'botConversations/setPendingTransferredConversationId',
      currentConversationId.value
    )
  }

  if (
    isAsyncEssayReviewEnabled.value &&
    props.topic === 'college' &&
    props.subject === 'essays'
  ) {
    store.dispatch('app/modal/show', {
      component: 'EssayHelpModal',
      data: {
        backText: 'Dashboard',
        showTemplateButtons: false,
        topic: props.topic,
        subject: props.subject,
        sessionArgs: {},
        svg: TutorIcon,
        skipPresessionSurvey: false,
      },
    })

    return
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
