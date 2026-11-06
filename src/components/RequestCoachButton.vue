<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from 'vuex'
import LargeButton from './LargeButton.vue'
import { useAppModalStore } from '@/stores/app/modal'
import { useSessionStore } from '@/stores/session'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import { EVENTS } from '@/consts'
import type { Subject } from '@/types/subjects'
import type { CoachStatus } from '@/composables/useCoachStatuses'

// When a subject is already provided, go straight to the presession form.
// Otherwise, let the student choose from the volunteer's subjects first.
const props = withDefaults(
  defineProps<{
    volunteerId: string
    volunteerName: string
    sourceView: string
    backText?: string
    subject?: { name?: string; topicName?: string; displayName?: string }
    subjects?: string[]
    pastSessionId?: string
    coachStatus?: CoachStatus
    disabled?: boolean
    variant?: string
    isVolunteerOffline?: boolean
  }>(),
  {
    backText: 'My Coaches',
    disabled: false,
    variant: 'primary-blue',
    isVolunteerOffline: false,
  }
)

const store = useStore()
const sessionStore = useSessionStore()
const modal = useAppModalStore()
const loading = ref(false)
const error = ref('')

const canRequest = computed(
  () =>
    store.getters['user/isStudent'] &&
    store.getters[
      'featureFlags/isStudentRequestSpecificVolunteerSessionsEnabled'
    ] &&
    props.volunteerId &&
    props.volunteerName &&
    !store.state.user.session?.id &&
    !sessionStore.hasCooldown
)

const availableSubjects = computed(
  () => Object.values(store.state.subjects.subjects) as Subject[]
)

function openPresessionSurvey(subject: Subject) {
  if (!canRequest.value || props.disabled) return
  AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_REQUEST_TUTOR_AGAIN, {
    sourceView: props.sourceView,
    requestedVolunteerId: props.volunteerId,
    subject: subject.name,
    topic: subject.topicName,
    ...(props.pastSessionId ? { pastSessionId: props.pastSessionId } : {}),
    ...(props.coachStatus ? { coachStatus: props.coachStatus } : {}),
  })

  modal.show({
    component: 'SubjectSelectionModal',
    data: {
      backText: props.backText,
      acceptText: 'Continue',
      topic: subject.topicName,
      title: subject.topicDisplayName || '',
      subtopics: [subject.name],
      subtopicDisplayNames: { [subject.name]: subject.displayName },
      preSelectedSubtopic: subject.name,
      subtitle: `Start a ${subject.displayName} session with ${props.volunteerName}.`,
      sessionArgs: { requestedVolunteerId: props.volunteerId },
    },
  })
}

function requestCoach() {
  if (!canRequest.value || props.disabled || loading.value) return

  loading.value = true
  error.value = ''

  try {
    const options = availableSubjects.value.filter((subject) => {
      if (props.subject?.name) {
        return subject.name === props.subject.name
      }

      if (props.subject) {
        return (
          subject.topicName === props.subject.topicName &&
          subject.displayName === props.subject.displayName
        )
      }

      return props.subjects?.includes(subject.name) && subject.active
    })

    if (!options.length) {
      throw new Error('No available subjects for this coach')
    }
    if (props.subject) {
      openPresessionSurvey(options[0])
    } else {
      modal.show({
        component: 'SubjectSelectionModal',
        data: {
          backText: props.backText,
          showTemplateButtons: false,
          volunteerSubjects: options,
          volunteerName: props.volunteerName,
          isVolunteerOffline: props.isVolunteerOffline,
          sessionArgs: { requestedVolunteerId: props.volunteerId },
          onSubjectSelected: (name: string) => {
            const subject = options.find((option) => option.name === name)
            if (subject) {
              AnalyticsService.captureEvent(
                EVENTS.STUDENT_CLICKED_REQUEST_TUTOR_AGAIN,
                {
                  sourceView: props.sourceView,
                  requestedVolunteerId: props.volunteerId,
                  subject: subject.name,
                  topic: subject.topicName,
                }
              )
            }
          },
        },
      })
    }
  } catch (err) {
    LoggerService.noticeError(err)
    error.value = `Couldn't start request. Try again.`
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div v-if="canRequest">
    <large-button
      :variant="variant"
      :showArrow="false"
      :disabled="disabled || loading"
      @click.stop="requestCoach"
      ><slot>Request {{ volunteerName }}</slot></large-button
    >
    <p v-if="error" role="alert">{{ error }}</p>
  </div>
</template>
