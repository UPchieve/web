<template>
  <div class="SessionFulfilledModal">
    <h1 class="SessionFulfilledModal-title">{{ text.title }}</h1>
    <div class="SessionFulfilledModal-message">{{ text.body }}</div>
    <large-button v-if="mobileMode" primary @click="onAccept">{{
      modalData.acceptText
    }}</large-button>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import LargeButton from '@/components/LargeButton.vue'

export default {
  name: 'SessionFulfilledModal',
  components: { LargeButton },
  props: {
    modalData: { type: Object, required: true },
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
    }),
    error() {
      return this.modalData.error
    },
    isSessionStudent() {
      return this.modalData.sessionStudentId === this.user.id
    },
    hasVolunteerJoined() {
      return !!this.modalData.sessionVolunteerId
    },
    text() {
      const thankYouMessage = 'Thanks for trying, we really appreciate it!'
      let body = ''
      let title = ''

      if (this.isAnotherVolunteerHasJoinedError()) {
        title = 'Session Fulfilled'
        body = `Another volunteer has already joined this session. ${thankYouMessage}`
      } else if (this.isAnotherStudentHasJoinedError()) {
        title = 'Session Join Error'
        body = `Cannot join another student's session.`
      } else if (this.isSessionHasEndedError()) {
        title = 'Session Canceled'
        if (this.isSessionStudent && !this.hasVolunteerJoined) {
          body = 'You have canceled your request'
        } else if (this.isVolunteer && !this.hasVolunteerJoined) {
          body = `The student has canceled their request. ${thankYouMessage}`
        } else {
          title = 'Session Ended'
          body = 'This session has ended.'
        }
      } else {
        title = 'Error'
        body = 'Something went wrong. Please refresh the page.'
      }

      return { title, body }
    },
  },
  methods: {
    onAccept() {
      this.$router.push('/')
    },
    isAnotherVolunteerHasJoinedError() {
      return this.error === 'Error: A volunteer has already joined the session'
    },
    isAnotherStudentHasJoinedError() {
      return (
        this.error === `Error: A student cannot join another student's session`
      )
    },
    isSessionHasEndedError() {
      return this.error === 'Error: Session has ended'
    },
  },
}
</script>

<style lang="scss" scoped>
.SessionFulfilledModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above('medium') {
    @include child-spacing(top, 16px);
  }
}

.SessionFulfilledModal-title {
  @include font-category('display-small');
  @include breakpoint-above('medium') {
    margin-top: 24px;
  }
}

.SessionFulfilledModal-message {
  @include font-category('body');
}
</style>
