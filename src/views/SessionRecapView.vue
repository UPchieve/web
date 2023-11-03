<template>
  <div class="session-recap-page">
    <loader v-if="isLoadingRecap" class="recap-loader" />
    <template v-else>
      <div class="chat-card-editor-container">
        <div class="recap-card">
          <h2 class="card-title">Session Recap</h2>
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
              user.isVolunteer ? 'Student:' : 'Coach:'
            }}</span>
            <div class="card-detail card-detail__sub-container">
              <div class="card-detail">
                {{
                  user.isVolunteer
                    ? session.studentFirstName
                    : session.volunteerFirstName
                }}
              </div>
              <favoriting-toggle
                v-if="!user.isVolunteer"
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
                  :is="user.isVolunteer ? studentAvatar : volunteerAvatar"
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
                :is="user.isVolunteer ? studentAvatar : volunteerAvatar"
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

export default {
  components: {
    ChatLog,
    FavoritingToggle,
    LoadingMessage,
    Loader,
    SessionChat,
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      recapSession: state => state.user.recapSession,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isRecapSocketUpdatesActive: 'featureFlags/isRecapSocketUpdatesActive',
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
      return this.$socket.connected && this.socketJoinedRoom
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
      socketJoinedRoom: false,
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
      if (this.user.isVolunteer)
        AnalyticsService.captureEvent(EVENTS.VOLUNTEER_OPENED_SESSION_RECAP)
      if (this.isRecapDmsAvailable && this.isRecapSocketUpdatesActive)
        this.joinSocketToRoom()
      // This is to mock the previous behavior before the updates, where
      // we kept`isSessionConnectionAlive` as `true`
      if (!this.isRecapSocketUpdatesActive) this.socketJoinedRoom = true
    } catch (error) {
      if (error.status === 403) this.$router.push('/dashboard')
    } finally {
      this.isLoadingRecap = false
    }

    // The divs that contain the editors are not loaded onto the DOM immediately because they
    // have conditions that must consult the `this.session`. $nextTick allows us to execute
    // code on the related DOM elements on the next DOM update cycle
    this.$nextTick(async () => {
      if (this.session.quillDoc) {
        const container = document.querySelector('.quill-container')
        this.quillEditor = new Quill(container)
        this.quillEditor.enable(false)
        this.quillEditor.setContents(JSON.parse(this.session.quillDoc))
      }

      if (this.session.hasWhiteboardDoc) {
        this.zwibblerCtx = window.Zwibbler.create('zwibbler-container', {
          showToolbar: false,
          showColourPanel: false,
          collaborationServer: `${config.websocketRoot}/whiteboard/recap/${this.session.id}`,
          readOnly: true,
          allowZoom: false,
        })

        // Allow 20 seconds for Zwibbler to retry to get the document from the server otherwise,
        // leave the shared session to have Zwibbler stop connection retries
        setTimeout(() => {
          if (!this.isConnectedToWhiteboard) {
            this.failedLoadingWhiteboard()
            this.zwibblerCtx.leaveSharedSession()
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
      this.$socket.emit('sessions/recap:join', { sessionId: this.session.id })
    },
  },
  sockets: {
    redirect: function(error) {
      LoggerService.noticeError(
        error ??
          `Redirected from recap of session ${this.session.id} to the dashboard`
      )
      this.$router.push('/')
    },
    'sessions/recap:joined': function() {
      this.socketJoinedRoom = true
    },
    'sessions/recap:join-failed': function(error) {
      this.socketJoinedRoom = false
      LoggerService.noticeError(error)
      // Retry joining the room after 3 seconds
      setTimeout(() => this.joinSocketToRoom(), 3000)
    },
    connect() {
      if (this.isRecapSocketUpdatesActive) this.joinSocketToRoom()
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
  text-align: left;
  border-bottom: 2px solid $c-background-grey;
  padding-bottom: 0.5em;
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
