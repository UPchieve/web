<script lang="ts">
export enum SessionErrorType {
  INVALID_SUBJECT_TOPIC = 'Invalid subject and topic.',
  VOLUNTEER_ALREADY_JOINED = 'A volunteer has already joined the session.',
  STUDENT_CANNOT_JOIN_OTHER = `A student cannot join another student's session.`,
  VOLUNTEER_CANNOT_CREATE = 'Volunteers cannot create new sessions.',
  JOINING_OWN_SESSION = 'You may not join your own session as both student and coach.',
  STUDENT_HAS_ACTIVE_SESSION = 'Student already has an active session.',
  SESSION_HAS_ENDED = 'Session has ended.',
  SESSION_CHAT_ERROR = 'SESSION_CHAT_ERROR',
}

export default {
  name: 'SessionErrorModal',
}
</script>
<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import { useRouter } from 'vue-router'
import LargeButton from '@/components/LargeButton.vue'
import type { SessionErrorModalData } from '@/services/ModalService'

type Props = {
  modalData: SessionErrorModalData
}

defineExpose({
  onAccept,
})

const props = defineProps<Props>()
const store = useStore<any>()
const router = useRouter()

const mobileMode = computed(() => store.getters['app/mobileMode'])
const isVolunteer = computed(() => store.getters['user/isVolunteer'])
const isStudent = computed(() => store.getters['user/isStudent'])

const errorMessage = props.modalData.error

function onAccept() {
  if (props.modalData.onAccept) {
    props.modalData.onAccept()
  } else {
    router.push('/')
  }
}

function isInvalidSubjectAndTopic() {
  return errorMessage === SessionErrorType.INVALID_SUBJECT_TOPIC
}
function hasAnotherVolunteerJoined() {
  return errorMessage === SessionErrorType.VOLUNTEER_ALREADY_JOINED
}
function isAnotherStudentJoining() {
  return errorMessage === SessionErrorType.STUDENT_CANNOT_JOIN_OTHER
}
function isVolunteerCreatingSession() {
  return errorMessage === SessionErrorType.VOLUNTEER_CANNOT_CREATE
}
function isJoiningOwnSession() {
  return errorMessage === SessionErrorType.JOINING_OWN_SESSION
}
function hasActiveSession() {
  return errorMessage === SessionErrorType.STUDENT_HAS_ACTIVE_SESSION
}
function hasSessionEnded() {
  return errorMessage === SessionErrorType.SESSION_HAS_ENDED
}
function isUnableToJoinChat() {
  return errorMessage === SessionErrorType.SESSION_CHAT_ERROR
}

const text = computed(() => {
  const thankYouMessage = 'Thanks for trying, we really appreciate it!'
  let title = ''
  let body = ''

  if (isInvalidSubjectAndTopic()) {
    body = 'Whoops, that subject and topic combination is wrong!'
  } else if (hasAnotherVolunteerJoined()) {
    title = 'Session Fulfilled'
    body = `Another volunteer has already joined this session. ${thankYouMessage}`
  } else if (isAnotherStudentJoining()) {
    body = `Whoops! You can't join another student's session.`
  } else if (isVolunteerCreatingSession()) {
    body = 'A coach cannot create a new session.'
  } else if (isJoiningOwnSession()) {
    body = 'You cannot join your own session!'
  } else if (hasActiveSession()) {
    body = 'You already have an active session!'
  } else if (hasSessionEnded()) {
    title = 'Session Ended'
    if (isStudent.value) {
      body =
        'This session has ended. You can request a new session on the dashboard!'
    }
    if (isVolunteer.value) {
      body = `The student has already ended this session. ${thankYouMessage}`
    }
  } else if (isUnableToJoinChat()) {
    title = 'Session Chat Error'
    body = `Uh oh, we were unable to connect you to the session's chat.\n Please refresh and try again!`
  }

  title = title || 'Session Error'
  body = body || 'Something went wrong. Please try joining again.'

  return { title, body }
})
</script>

<template>
  <div class="container">
    <h1 class="title">{{ text.title }}</h1>
    <div class="body">{{ text.body }}</div>

    <large-button
      v-if="mobileMode"
      @click="onAccept"
      variant="primary-blue"
      :showArrow="false"
      >{{ modalData.acceptText }}</large-button
    >
  </div>
</template>

<style lang="scss" scoped>
.container {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above('medium') {
    @include child-spacing(top, 16px);
  }
}

.title {
  @include font-category('display-small');
  @include breakpoint-above('medium') {
    margin-top: 24px;
  }
}

.body {
  @include font-category('body');
}
</style>
