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
        <chat-log
          v-if="mobileMode"
          class="chat"
          :messages="session.messages"
          :studentId="session.studentId"
          :volunteerId="session.volunteerId"
        />
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
      <chat-log
        v-if="!mobileMode"
        :messages="session.messages"
        :studentId="session.studentId"
        :volunteerId="session.volunteerId"
      />
    </template>
  </div>
</template>

<script>
import ChatLog from '@/components/ChatLog.vue'
import NetworkService from '@/services/NetworkService'
import AnalyticsService from '@/services/AnalyticsService'
import FavoritingToggle from '@/components/FavoritingToggle.vue'
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'
import Quill from 'quill'
import config from '../config'
import LoadingMessage from '@/components/LoadingMessage.vue'
import Loader from '@/components/Loader.vue'
import { EVENTS } from '@/consts'

export default {
  components: {
    ChatLog,
    FavoritingToggle,
    LoadingMessage,
    Loader,
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    whiteboardDimensions() {
      return {
        width: 1000,
        height: 2800,
      }
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
    }
  },
  async created() {
    try {
      this.isLoadingRecap = true
      const response = await NetworkService.getSessionRecap(
        this.$route.params.sessionId
      )
      this.session = response.data.session
      AnalyticsService.captureEvent(EVENTS.VOLUNTEER_OPENED_SESSION_RECAP)
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
</style>
