<template>
  <div class="session-recap-page">
    <loader v-if="isLoadingRecap" class="recap-loader" />
    <template v-else>
      <div class="chat-card-editor-container">
        <div class="recap-card">
          <header class="recap-card__header recap-card__header-start-session">
            <h2 class="card-title">Session Recap</h2>
            <large-button
              v-if="progressReport.id"
              class="recap-card__button"
              @click="handleSessionRequest"
              :showArrow="false"
            >
              Start a {{ session.subject }} session
            </large-button>
          </header>

          <div class="spacing--grid">
            <span class="card-detail__title">Subject:</span>
            <div class="card-detail__sub-container">
              <div class="card-detail">{{ session.subject }}</div>
              <img
                :src="session.topicIconLink"
                :alt="`${session.topic} icon`"
                class="subject-icon card-detail"
              />
            </div>
            <span class="card-detail__title">Time:</span>
            <div class="card-detail">
              {{ getSessionTime(session.createdAt) }}
            </div>
            <span class="card-detail__title">{{
              isVolunteer ? 'Student:' : 'Coach:'
            }}</span>
            <div class="card-detail card-detail__sub-container">
              <div class="card-detail">
                {{
                  isVolunteer
                    ? session.studentFirstName
                    : session.volunteerFirstName
                }}
              </div>
              <favoriting-toggle
                v-if="isStudent"
                :initialIsFavorite="session.isFavorited"
                :volunteerName="session.volunteerFirstName"
                :volunteerId="session.volunteerId"
                class="heart"
              />
            </div>
          </div>
        </div>
        <template v-if="mobileMode">
          <chat-log
            v-if="!isRecapDmsAvailable"
            class="chat"
            :messages="session.messages"
            :studentId="session.studentId"
            :volunteerId="session.volunteerId"
          />
          <div class="chat chat__dms" v-if="isRecapDmsAvailable">
            <div class="chat-header chat__dms-header">
              <div class="chat__dms-avatar-container">
                <component
                  class="chat-header__avatar"
                  :is="isVolunteer ? studentAvatar : volunteerAvatar"
                />
                <div class="chat-header__title">Session Chat</div>
              </div>
              <button class="report-btn" @click="reportSession" type="button">
                Report
              </button>
            </div>
            <session-chat
              class="chat__dms-session-chat"
              :currentSession="recapSession"
              :shouldHideChatSection="false"
              :setHasSeenNewMessage="setHasSeenNewMessage"
              :isInRecap="true"
              :isSessionConnectionAlive="isSessionConnectionAlive"
              :isSessionAlive="isSessionAlive"
            />
          </div>
        </template>
        <dropdown
          v-if="progressReport && progressReport.status === 'complete'"
          :toggleStyles="{
            padding: '1.4em 2em',
            backgroundColor: '#FEDF85',
          }"
          class="progress-report__dropdown"
          @toggled="handleProgressReportToggle"
        >
          <template v-slot:header>
            <p class="progress-report__dropdown-header">
              <span class="progress-report__dropdown-header--insight"
                >Session Review</span
              >
            </p>
          </template>
          <template v-slot:content>
            <div class="progress-report__dropdown-content">
              <separator class="separator" />
              <progress-report-session
                class="progress-report-session"
                v-if="progressReport.id"
                :progressReport="progressReport"
                :subjectDisplayName="session.subject"
              />
            </div>
          </template>
        </dropdown>
        <div v-if="session.quillDoc" class="document">
          <h2 class="document__title">Doc Editor</h2>
          <div class="document__container">
            <div class="quill-container"></div>
          </div>
        </div>
        <div v-if="session.hasWhiteboardDoc" class="document">
          <h2 class="document__title">Whiteboard</h2>
          <p v-if="loadingWhiteboardError" class="error">
            {{ loadingWhiteboardError }}
          </p>
          <div class="whiteboard-wrapper">
            <transition name="whiteboard-warning">
              <loading-message
                message="Loading the whiteboard"
                class="whiteboard-warning whiteboard-warning--connection"
                v-show="!isConnectedToWhiteboard && !loadingWhiteboardError"
              />
            </transition>
            <div id="zwibbler-container"></div>
          </div>
        </div>
      </div>
      <template v-if="!mobileMode">
        <chat-log
          v-if="!isRecapDmsAvailable"
          :messages="session.messages"
          :studentId="session.studentId"
          :volunteerId="session.volunteerId"
        />
        <div class="chat chat__dms" v-if="isRecapDmsAvailable">
          <div class="chat-header chat__dms-header">
            <div class="chat__dms-avatar-container">
              <component
                class="chat-header__avatar"
                :is="isVolunteer ? studentAvatar : volunteerAvatar"
              />
              <div class="chat-header__title">Session Chat</div>
            </div>
            <button
              v-if="!reportSubmitted"
              class="report-btn"
              @click="reportSession"
              type="button"
            >
              Report
            </button>
            <span v-else class="report-btn report-btn--submitted">
              Reported
            </span>
          </div>
          <session-chat
            class="chat__dms-session-chat"
            :currentSession="recapSession"
            :shouldHideChatSection="false"
            :setHasSeenNewMessage="setHasSeenNewMessage"
            :isInRecap="true"
            :isSessionConnectionAlive="isSessionConnectionAlive"
            :isSessionAlive="isSessionAlive"
          />
        </div>
      </template>
    </template>
  </div>
</template>

<script>
import ChatLog from '@/components/ChatLog.vue'
import FavoritingToggle from '@/components/FavoritingToggle.vue'
import Loader from '@/components/Loader.vue'
import LoadingMessage from '@/components/LoadingMessage.vue'
import ProgressReportSession from '@/components/ProgressReportSession.vue'
import Dropdown from '@/components/Dropdown.vue'
import Separator from '@/components/Separator.vue'
import LargeButton from '@/components/LargeButton.vue'
import { EVENTS } from '@/consts'
import AnalyticsService from '@/services/AnalyticsService'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import SessionChat from '@/views/SessionView/SessionChat/index.vue'
import StudentIcon from '@/assets/student-icon.svg'
import VolunteerIcon from '@/assets/volunteer-icon.svg'
import moment from 'moment'
import Quill from 'quill'
import { mapGetters, mapState } from 'vuex'
import config from '../config'
import { socket } from '@/socket'
import { markRaw } from 'vue'

export default {
  components: {
    ChatLog,
    FavoritingToggle,
    LoadingMessage,
    Loader,
    SessionChat,
    ProgressReportSession,
    Dropdown,
    Separator,
    LargeButton,
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      recapSession: (state) => state.user.recapSession,
      socketJoinedRoom: (state) => state.socket.socketJoinedRoom,
      isConnected: (state) => state.socket.isConnected,
    }),
    ...mapGetters({
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      mobileMode: 'app/mobileMode',
    }),
    whiteboardDimensions() {
      return {
        width: 1000,
        height: 2800,
      }
    },
    studentAvatar() {
      return StudentIcon
    },
    volunteerAvatar() {
      return VolunteerIcon
    },
    isSessionConnectionAlive() {
      return socket.connected && this.socketJoinedRoom
    },
    isJoinedSessionSocketReadyToEmit() {
      return [this.isConnected, this.session?.id]
    },
  },
  data() {
    return {
      session: {},
      quillEditor: null,
      loadingWhiteboardError: '',
      zwibblerCtx: null,
      isConnectedToWhiteboard: false,
      isLoadingRecap: true,
      // Session is considered alive when in recap mode
      isSessionAlive: true,
      isRecapDmsAvailable: false,
      reportSubmitted: false,
      progressReport: {},
    }
  },
  async created() {
    try {
      this.isLoadingRecap = true
      const response = await NetworkService.getSessionRecap(
        this.$route.params.sessionId
      )
      this.session = response.data.session
      this.isRecapDmsAvailable = response.data.isRecapDmsAvailable
      this.$store.dispatch('user/fetchRecapSessionForDms', this.session.id)

      if (this.isStudent) await this.getProgressReportForSession()
    } catch (error) {
      if (error.status === 403) this.$router.push('/dashboard')
    } finally {
      this.isLoadingRecap = false
    }

    if (
      this.isJoinedSessionSocketReadyToEmit[0] &&
      this.isJoinedSessionSocketReadyToEmit[1] &&
      this.isRecapDmsAvailable
    )
      this.joinSocketToRoom()

    // The divs that contain the editors are not loaded onto the DOM immediately because they
    // have conditions that must consult the `this.session`. $nextTick allows us to execute
    // code on the related DOM elements on the next DOM update cycle
    // TODO: Clean this up so that the whiteboard doesn't rely on nextTick
    this.$nextTick(async () => {
      if (this.session.quillDoc) {
        const container = document.querySelector('.quill-container')
        this.quillEditor = new Quill(container)
        this.quillEditor.enable(false)
        this.quillEditor.setContents(JSON.parse(this.session.quillDoc))
      }

      if (this.session.hasWhiteboardDoc) {
        this.zwibblerCtx = markRaw(
          window.Zwibbler.create('zwibbler-container', {
            showToolbar: false,
            showColourPanel: false,
            collaborationServer: `${config.websocketRoot}/whiteboard/recap/${this.session.id}`,
            readOnly: true,
            allowZoom: false,
          })
        )

        // Allow 20 seconds for Zwibbler to retry to get the document from the server otherwise,
        // leave the shared session to have Zwibbler stop connection retries
        setTimeout(() => {
          if (!this.isConnectedToWhiteboard) {
            this.failedLoadingWhiteboard()
            // This method doesn't exist in zwibbler-demo.js
            if (this.zwibblerCtx?.leaveSharedSession) {
              this.zwibblerCtx.leaveSharedSession()
            }
          }
        }, 1000 * 20)

        try {
          await this.zwibblerCtx.joinSharedSession(this.session.id, false)
        } catch (error) {
          this.failedLoadingWhiteboard()
        }

        this.zwibblerCtx.on('connected', () => {
          this.zwibblerCtx.setPaperSize(
            this.whiteboardDimensions.width,
            this.whiteboardDimensions.height
          )
          this.resizeViewRectangle()
          this.isConnectedToWhiteboard = true
        })
      }
    })
  },
  beforeUnmount() {
    socket.emit('sessions/recap:leave', { sessionId: this.session.id })
  },
  methods: {
    getSessionTime(sessionCreatedAt) {
      return moment(sessionCreatedAt).format('l, h:mm A')
    },
    resizeViewRectangle() {
      this.zwibblerCtx.setViewRectangle({
        x: 0,
        y: 0,
        // this is the width that is set in Whiteboard.vue for when a user is in a session
        width: 1000,
        // height needs to be non-zero. setViewRectangle seems to properly scale the whiteboard if a width is set
        height: 1,
      })
    },
    failedLoadingWhiteboard() {
      this.loadingWhiteboardError =
        'Failed to load the whiteboard. Please try refreshing the page.'
    },
    setHasSeenNewMessage(value) {
      this.hasSeenNewMessage = value
    },
    toggleReportSubmitted() {
      this.reportSubmitted = true
    },
    reportSession() {
      this.$store.dispatch('app/modal/show', {
        component: 'ReportSessionModal',
        data: {
          showTemplateButtons: false,
          currentSession: this.recapSession,
          isInRecap: true,
          toggleReportSubmitted: this.toggleReportSubmitted,
        },
      })
    },
    joinSocketToRoom() {
      socket.emit('sessions/recap:join', { sessionId: this.session.id })
    },
    async getProgressReportForSession() {
      try {
        const response = await NetworkService.getProgressReportForSession(
          this.session.id
        )
        if (response.data.id) this.progressReport = response.data
      } catch (error) {
        LoggerService.noticeError(error)
      }
    },
    handleSessionRequest() {
      AnalyticsService.captureEvent(
        EVENTS.PROGRESS_REPORT_SESSION_RECAP_STUDENT_REQUESTED_HELP
      )
      this.$router.push('/session/readingWriting/reading/')
    },
    handleProgressReportToggle(isOpen) {
      if (isOpen)
        AnalyticsService.captureEvent(
          EVENTS.PROGRESS_REPORT_SESSION_RECAP_STUDENT_CLICKED_REPORT,
          {
            sessionId: this.session.id,
          }
        )
    },
  },
  watch: {
    socketJoinedRoom(val) {
      if (val === false) {
        setTimeout(() => this.joinSocketToRoom(), 3000)
      }
    },
    isJoinedSessionSocketReadyToEmit(currentValue, prevValue) {
      const [isConnected, sessionId] = currentValue
      const [prevIsConnected, prevSessionId] = prevValue
      if (
        isConnected &&
        sessionId &&
        this.isRecapDmsAvailable &&
        (!prevIsConnected || !prevSessionId || !this.isRecapDmsAvailable)
      )
        this.joinSocketToRoom()
    },
  },
}
</script>

<style lang="scss" scoped>
.chat-card-editor-container {
  @include flex-container(column);
  flex-basis: 60%;
}

.card-title {
  @include font-category('display-small');
}

.session-recap-page {
  padding: 35px;
  height: 100%;
  max-width: 1200px;

  @include breakpoint-above('large') {
    display: flex;
    flex-flow: row wrap;
    height: 1300px;
  }
}

.recap-card {
  background-color: $upchieve-white;
  border-radius: 8px 8px 16px 16px;
  padding: 22px;
  margin-right: 1.8em;
  margin-bottom: 1.8em;

  @include breakpoint-below('large') {
    margin-right: 0;
  }

  &__header {
    @include flex-container(row, space-between, center);

    &-start-session {
      @include breakpoint-between('300px', '560px') {
        @include flex-container(column, space-between, flex-start);
      }
      @include breakpoint-between('992px', '1200px') {
        @include flex-container(column, space-between, flex-start);
      }
      @include breakpoint-between('772px', '830px') {
        @include flex-container(column, space-between, flex-start);
      }
    }
  }

  &__button {
    background-color: $c-information-blue;
    color: $upchieve-white;

    &:hover {
      background: darken($c-information-blue, 5%);
    }
  }
}

.spacing--grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
}

.card-detail {
  @include font-category('heading');
  text-align: left;
  margin: 1em 0.5em 0.5em 0.5em;

  &__title {
    font-size: 18px;
    font-weight: 500;
    text-align: left;
    margin: 1em 0.5em 0.5em 0.5em;
  }

  &__sub-container {
    @include flex-container(row, normal, center);
    margin: 0;
  }
}

.chat {
  margin-bottom: 1.8em;
  flex-basis: 40%;

  &-header {
    background-color: $c-information-blue;
    padding: 21px;
    text-align: left;
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    border-radius: 8px 8px 0px 0px;

    &__avatar {
      width: 40px;
      height: 40px;
    }

    &__title {
      font-weight: 600;
      font-size: 18px;
      color: #fff;
      margin-left: 1em;
    }
  }

  &__dms {
    @include flex-container(column);

    &-header {
      @include flex-container(row, space-between, center);
    }

    &-avatar-container {
      @include flex-container(row, space-between, center);
    }

    &-session-chat {
      height: 700px;
      max-height: 700px;
    }
  }
}

.document {
  @include flex-container(column);
  margin-right: 1.8em;
  margin-bottom: 1.8em;
  font-size: 20px;
  height: 500px;
  overflow-y: auto;
  background-color: $upchieve-white;
  padding: 22px;
  border-radius: 8px 8px 16px 16px;

  &__title {
    @include font-category('display-small');
    border-bottom: 2px solid $c-background-grey;
    text-align: left;
    padding-bottom: 0.5em;
  }

  @include breakpoint-below('large') {
    margin-right: 0;
  }

  &__container {
    overflow-y: auto;
    height: 100%;
  }
}

.progress-report__dropdown {
  background-color: $upchieve-white;
  border-radius: 8px;
  margin-bottom: 1.8em;

  &-content {
    padding: 0 2em;
  }

  &-header {
    @include font-category('heading');
    margin-bottom: 0;

    &--insight {
      font-weight: 500;
    }
  }

  @include breakpoint-above('large') {
    margin-right: 1.8em;
  }
}

.progress-report-session {
  padding: 1em 0;
}

.separator {
  border: 1px solid $c-background-grey;
}

.error {
  color: $c-error-red;
  margin: 1em 0;
}

.subject-icon {
  height: 24px;
  width: 24px;
}

.heart {
  width: 18.46px;
  height: 17.14px;
  padding-left: 4px;
}

#zwibbler-container {
  height: 100%;
  width: 100%;
}

.whiteboard-wrapper {
  height: 100%;
  width: 100%;
  position: relative;
}

.recap-loader {
  margin: 0 auto;
}

.report-btn {
  display: block;
  border: none;
  background-color: inherit;
  font-weight: 500;
  cursor: pointer;
  color: #fff;
  padding: 0 5px;
  margin-right: 10px;

  &:hover {
    color: #e8e8e8;
  }

  &--submitted {
    color: $c-disabled-grey;

    &:hover {
      color: $c-disabled-grey;
    }
  }
}
</style>
