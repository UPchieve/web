<script lang="ts" setup>
import { useStore } from 'vuex'
import { computed } from 'vue'
import RightArrowCircled from '@/assets/icons/right_arrow_circled.svg'

const store = useStore()
const iconLink = computed(
  () =>
    store.getters['subjects/subjectIconLinksBySubject'][props.session.subject]
)
type SessionListItemProps = {
  session: {
    id: string
    studentFirstName?: string
    student?: {
      firstname?: string
      isShadowBanned?: boolean
    }
    subject: string
    subjectDisplayName: string
    waitTime: string
    isLongWait: boolean
    topic: string // i.e. 'math'
    isLocked: boolean
    isExclusive?: boolean
  }
}

const props = defineProps<SessionListItemProps>()

const isAdmin = computed(() => store.state.user.user?.isAdmin)
// Anonymize the student's name for locked sessions
const studentName = computed(() =>
  props.session.isLocked
    ? 'Student'
    : (props.session.studentFirstName ??
      props.session.student?.firstname ??
      'Student')
)
</script>

<template>
  <div class="grid">
    <!--  Leftmost cell: Topic icon-->
    <div class="topic-icon-cell centered">
      <img class="subject-icon" :src="iconLink" />
    </div>

    <!--  Center cell: Subject and student name-->
    <div class="basic-info-cell">
      <span
        v-if="props.session.isExclusive"
        :data-testid="`exclusive-session-alert-${props.session.id}`"
        class="exclusive-session-alert"
      >
        <span
          class="exclusive-emoji"
          :data-testid="`exclusive-emoji-${props.session.id}`"
          >🙋</span
        >
        Specifically requested you
      </span>
      <div class="session-subject" :data-testid="`subject-${props.session.id}`">
        <span v-if="props.session.isLocked">🔒</span>
        <span>{{ props.session.subjectDisplayName }}</span>
      </div>
      <span class="student-name">
        {{ studentName }}
        <span
          v-if="props.session.student?.isShadowBanned && isAdmin"
          class="shadow-ban"
          data-testid="shadow-ban-badge"
          >Shadow Banned</span
        >
      </span>
    </div>

    <!--  Third cell: Wait time-->
    <div
      class="wait-time-cell"
      :class="{ 'wait-time-cell--long': props.session.isLongWait }"
      :data-testid="`wait-time-${props.session.id}`"
    >
      {{ props.session.waitTime }}
    </div>

    <!--  Rightmost cell: Pick up session button-->
    <div class="accept-session-icon-cell centered">
      <RightArrowCircled class="accept-icon" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.grid {
  display: grid;
  grid-template-rows: 1fr;
  grid-template-columns: [topicIcon] 0.5fr [basicInfo] 6fr [waitTime] 0.5fr [acceptIcon] 0.5fr;
  grid-column-gap: 16px;

  div {
    display: flex;
    flex-direction: column;
    // Stretch every cell to the full row height, then center its contents
    align-self: stretch;
    justify-content: center;
  }

  .topic-icon-cell {
    grid-row: 1;
    grid-column: topicIcon;
  }

  .basic-info-cell {
    grid-row: 1;
    grid-column: basicInfo;
    display: grid;
    line-height: 1.25;

    grid-template-rows: [alert] auto [subject] auto [student] auto;
    grid-template-columns: 1fr;
    align-content: center;

    .session-subject {
      grid-row: subject;
      grid-column: 1;
      font-weight: $font-weight-medium;
      display: flex;
      flex-direction: row;
      justify-content: start;
      gap: 4px;
    }

    .student-name {
      grid-row: student;
      grid-column: 1;
      color: $c-soft-black;
    }

    .exclusive-session-alert {
      grid-row: alert;
      grid-column: 1;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-size: 11px;
      font-weight: $font-weight-bold;
      color: #4d3a00;
      margin-bottom: 2px;

      .exclusive-emoji {
        margin-right: 2px;
      }
    }
  }

  .wait-time-cell {
    grid-row: 1;
    grid-column: waitTime;
    text-align: center;

    &--long {
      font-weight: $font-weight-bold;
    }
  }

  .accept-session-icon-cell {
    grid-row: 1;
    grid-column: acceptIcon;
  }
}

.subject-icon {
  width: 32px;
  height: 32px;
}

.accept-icon {
  width: 24px;
  height: 24px;
}

.centered {
  align-items: center;
}

.shadow-ban {
  margin-left: 8px;
  font-size: 12px;
  border-radius: 5px;
  background: $c-warning-orange;
  color: #fff;
  padding: 5px;
  font-weight: 500;
  white-space: nowrap;
}
</style>
