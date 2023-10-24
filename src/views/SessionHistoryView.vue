<template>
  <div class="session-history">
    <section class="header">
      <h1 class="title">
        Session History
      </h1>
      <p v-if="!mobileMode" class="subtitle">
        {{
          user.isVolunteer
            ? 'On this page you can review your past sessions on UPchieve'
            : `On this page you can review your past sessions on UPchieve and favorite
        your preferred Academic Coaches. We'll do our best to pair you with your
        favorited coaches when they're available.`
        }}
      </p>
    </section>
    <div v-if="!mobileMode" class="container">
      <section>
        <div class="spacing--grid spacing--grid-4 session-list__headers">
          <span>SUBJECT</span>
          <span>DATE</span>
          <span>{{ user.isVolunteer ? 'STUDENT' : 'COACH' }}</span>
          <span>SESSION RECAP</span>
        </div>
        <div v-if="error">
          <h1 class="title title--body">
            {{ error }}
          </h1>
        </div>
        <loader
          v-else-if="isFetchingSessions"
          message="Retrieving your session history"
          class="session-history-loader"
        />
        <div v-else-if="hasNoPastSessions()" class="session-list">
          <h1 class="title title--body">
            Looks like you haven't had any sessions in the past 12 months.
          </h1>
        </div>
        <ul class="session-list" v-else>
          <li v-for="(session, index) in sessions" :key="session._id">
            <div class="session-list__session session-list__session--grid-4">
              <div class="session-list__subject-container">
                <img
                  :src="session.topicIconLink"
                  :alt="`${session.topic} icon`"
                  class="subject-icon"
                />
                <div class="subject-name-container">
                  <div class="subject">{{ session.subject }}</div>
                  <span class="subject-time-tutored">
                    {{ getSessionDuration(session.timeTutored) }} minutes</span
                  >
                </div>
              </div>
              <p class="session-list__created-at">
                {{ getSessionTime(session.createdAt) }}
              </p>
              <div class="session-list__partner-name-container">
                <favoriting-toggle
                  v-if="!user.isVolunteer"
                  :initialIsFavorite="session.isFavorited"
                  :volunteerName="session.volunteerFirstName"
                  :volunteerId="session.volunteerId"
                  v-on:change-favorited="updateFavoritedVolunteers"
                />
                <span class="session-list__partner-name">
                  {{
                    user.isVolunteer
                      ? session.studentFirstName
                      : session.volunteerFirstName
                  }}
                </span>
              </div>
              <div class="session-list__session-recap">
                <a :href="sessionRecapURL(session.id)">
                  <large-button
                    primary
                    class="session-list__session-recap__button"
                    >Session Recap</large-button
                  >
                </a>
              </div>
            </div>
            <div class="border--thin" v-if="index !== 5"></div>
          </li>
        </ul>
        <footer class="page-actions-container">
          <div class="page-actions">
            <div
              @click="() => getSessionHistory(page - 1)"
              :class="isFirstPage && 'page-actions__stepper--disabled'"
              class="page-actions__stepper"
            >
              <caret-icon class="caret caret--previous" /><span>Previous</span>
            </div>
            <div class="page-numbers">
              <span class="page-num page-num--active">
                {{ page }}
              </span>
            </div>
            <div
              @click="() => getSessionHistory(page + 1)"
              :class="isLastPage && 'page-actions__stepper--disabled'"
              class="page-actions__stepper"
            >
              <span>Next</span><caret-icon class="caret caret--next" />
            </div>
          </div>
        </footer>
      </section>
    </div>
    <div v-if="mobileMode">
      <div class="mobile-container">
        <section>
          <div v-if="error">
            <h1 class="title title--body">
              {{ error }}
            </h1>
          </div>
          <loader
            v-else-if="isFetchingSessions"
            message="Retrieving your session history"
            class="session-history-loader"
          />
          <div v-else-if="hasNoPastSessions()">
            <h1 class="title title--body mobile-session-list">
              Looks like you haven't had any sessions in the past 12 months.
            </h1>
          </div>
          <ul v-else class="mobile-session-list">
            <li v-for="(session, index) in sessions" :key="session._id">
              <div class="mobile-session-list__session">
                <div class="mobile-session-list__subject-container">
                  <img
                    :src="session.topicIconLink"
                    :alt="`${session.topic} icon`"
                    class="mobile-subject-icon"
                  />
                  <div class="mobile-subject-name-container">
                    <div class="mobile-subject">{{ session.subject }}</div>
                    <span class="mobile-subject-time-tutored">
                      {{ getSessionDuration(session.timeTutored) }}
                      minutes</span
                    >
                  </div>
                </div>
                <div class="mobile-session-list__createdAt-container">
                  <div class="mobile-session-list__partner-name-container">
                    <favoriting-toggle
                      v-if="!user.isVolunteer"
                      class="heart"
                      :initialIsFavorite="session.isFavorited"
                      :volunteerName="session.volunteerFirstName"
                      :volunteerId="session.volunteerId"
                      v-on:change-favorited="updateFavoritedVolunteers"
                    />
                    <span class="mobile-session-list__partner-name">
                      {{
                        user.isVolunteer
                          ? session.studentFirstName
                          : session.volunteerFirstName
                      }}
                    </span>
                  </div>
                  <span class="mobile-session-list__created-at">
                    {{ getSessionTimeForMobile(session.createdAt) }}</span
                  >
                </div>
                <a :href="sessionRecapURL(session.id)">
                  <caret-icon class="caret--next" />
                </a>
              </div>
              <div class="border--thin" v-if="index !== 5"></div>
            </li>
          </ul>
          <footer class="page-actions-container">
            <div class="page-actions">
              <div
                @click="() => getSessionHistory(page - 1)"
                :class="isFirstPage && 'page-actions__stepper--disabled'"
                class="page-actions__stepper"
              >
                <caret-icon class="caret caret--previous" />
              </div>
              <div class="page-numbers">
                <span class="page-num page-num--active">
                  {{ page }}
                </span>
              </div>
              <div
                @click="() => getSessionHistory(page + 1)"
                :class="isLastPage && 'page-actions__stepper--disabled'"
                class="page-actions__stepper"
              >
                <caret-icon class="caret caret--next" />
              </div>
            </div>
          </footer>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkService from '../services/NetworkService'
import CaretIcon from '@/assets/caret.svg'
import FavoritingToggle from '../components/FavoritingToggle.vue'
import LargeButton from '../components/LargeButton.vue'
import { mapState, mapGetters } from 'vuex'
import moment from 'moment'
import Loader from '@/components/Loader.vue'
import { backOff } from 'exponential-backoff'
import LoggerService from '@/services/LoggerService'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export default {
  name: 'session-history-view',
  components: { CaretIcon, FavoritingToggle, LargeButton, Loader },
  data() {
    return {
      sessions: [],
      page: 1,
      hasNext: false,
      total: 0,
      isFetchingSessions: false,
      isLastPage: false,
      error: '',
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    isFirstPage() {
      return this.page === 1
    },
    totalPages() {
      const sessionLimitPerPage = 5
      const totalPages = Math.ceil(this.total / sessionLimitPerPage)
      return totalPages === 0 ? 1 : totalPages
    },
  },
  methods: {
    async getSessionHistory(page) {
      if (page < 1 || page > this.totalPages) return
      this.isFetchingSessions = true
      if (page > this.page)
        AnalyticsService.captureEvent(
          EVENTS.VOLUNTEER_CLICKED_NEXT_SESSION_HISTORY_PAGE,
          {
            page,
          }
        )
      if (page < this.page)
        AnalyticsService.captureEvent(
          EVENTS.VOLUNTEER_CLICKED_PREVIOUS_SESSION_HISTORY_PAGE,
          {
            page,
          }
        )
      try {
        const response = await backOff(() =>
          NetworkService.getSessionHistory(page)
        )
        this.sessions = response.data.pastSessions
        this.isLastPage = response.data.isLastPage
        this.page = page
      } catch (error) {
        this.handleError(error)
      } finally {
        this.isFetchingSessions = false
      }
    },
    async getTotalSessions() {
      try {
        const response = await backOff(() =>
          NetworkService.getTotalSessionHistory()
        )
        this.total = response.data.total
      } catch (error) {
        this.handleError(error)
      }
    },
    handleError(error) {
      LoggerService.noticeError(error.response.data.err)
      this.error =
        'We were unable to load your history. Please try again later.'
    },
    getSessionTime(sessionCreatedAt) {
      return moment(sessionCreatedAt).format('l @ h:mm A')
    },
    getSessionTimeForMobile(sessionCreatedAt) {
      return moment(sessionCreatedAt).format('l h:mm A')
    },
    getSessionDuration(timeTutored) {
      const duration = Math.ceil(timeTutored / (1000 * 60))
      return duration
    },
    hasNoPastSessions() {
      return this.total === 0
    },
    updateFavoritedVolunteers(volunteerId, isFavorited) {
      this.sessions = this.sessions.map(session => ({
        ...session,
        isFavorited:
          session.volunteerId === volunteerId
            ? isFavorited
            : session.isFavorited,
      }))
    },
    sessionRecapURL(sessionId) {
      return `${sessionId}/recap`
    },
  },
  async created() {
    await Promise.all([
      this.getSessionHistory(this.page),
      this.getTotalSessions(),
    ])

    AnalyticsService.captureEvent(EVENTS.VOLUNTEER_OPENED_SESSION_HISTORY)
  },
}
</script>

<style lang="scss" scoped>
a {
  text-decoration: none;
}

ul {
  padding: 0px;
  height: 100%;
  margin: auto;
  list-style-type: none;
}

.header {
  text-align: left;
  margin-bottom: 2em;

  @include breakpoint-below('small') {
    margin-bottom: 0;
  }
}

.title {
  font-weight: 500;
  font-size: 22px;
  margin-bottom: 1em;

  @include breakpoint-below('small') {
    margin: 1em;
    font-size: 18px;
  }

  &--body {
    text-align: center;
    margin: 3em 1em 0 1em;
  }
}

.subtitle {
  @include font-category('heading');
  color: $c-secondary-grey;
}

.session-history {
  padding: 53px;

  @include breakpoint-below('large') {
    padding: 1em;
  }

  @include breakpoint-below('small') {
    padding: 0;
  }

  &-loader {
    margin: 1em 0;
    @include flex-container(column, center, center);
  }
}

.container {
  padding: 0;
  margin: 0;
  background-color: white;
  border: 1px solid $c-border-grey;
  border-radius: 8px 8px 16px 16px;
  min-width: 100%;
}

.spacing--grid {
  display: grid;
  text-align: center;

  &-3 {
    @include breakpoint-above('small') {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  &-4 {
    @include breakpoint-above('small') {
      grid-template-columns: 1fr 1fr 1fr 1fr;
    }
  }
}

.session-list {
  padding: 0 2em;
  min-height: 600px;

  @include breakpoint-below('large') {
    padding-right: 1.5em;
  }

  &__headers {
    @include font-category('subheading');
    background-color: $c-background-blue;
    width: 100%;
    padding: 1em 2em;
  }

  &__partner-name {
    @include font-category('subheading');
    margin: 0.8em;
    @include breakpoint-below('large') {
      font-size: 14px;
    }

    &-container {
      @include flex-container(row, center, center);

      @include breakpoint-below('medium') {
        width: 100px;
      }
    }
  }

  &__session {
    @include flex-container(row, space-around, center);
    display: grid;

    &--grid-3 {
      @include breakpoint-above('tiny') {
        grid-template-columns: 1fr 1fr 1fr;
      }
    }
    &--grid-4 {
      @include breakpoint-above('tiny') {
        grid-template-columns: 1fr 1fr 1fr 1fr;
      }
    }
    padding: 1em 0;
  }

  &__subject-container {
    @include flex-container(row, center, center);
  }

  &__created-at {
    text-align: center;
    @include font-category('subheading');
    color: $c-secondary-grey;
    @include breakpoint-below('large') {
      font-size: 14px;
      margin: 0.7em;
    }
  }

  &__session-recap {
    @include flex-container(row, center, center);

    &__button {
      border-color: $c-information-blue;
      background: #fff;
      color: $c-information-blue;
      fill: $c-information-blue;

      &:hover {
        background-color: rgba(24, 85, 209, 0.1);
        color: $c-information-blue;
        fill: $c-information-blue;
      }

      &:active {
        background-color: $c-information-blue;
        color: #fff;
        fill: #fff;
      }

      @include breakpoint-below('large') {
        transform: scale(0.8, 0.8);
      }
    }
  }
}

.subject {
  text-align: left;

  @include font-category('heading');
  @include breakpoint-below('large') {
    font-size: 16px;
  }

  &-icon {
    height: 50px;
    min-width: 50px;
    width: 50px;

    @include breakpoint-below('large') {
      min-width: initial;
      width: 30px;
    }
  }

  &-name-container {
    @include flex-container(column, center, flex-start);
    margin: 1.375em 0 1.375em 1em;
    width: 100px;

    @include breakpoint-below('large') {
      margin-left: 0.4em;
    }
  }

  &-time-tutored {
    @include font-category('helper-text');
    color: $c-secondary-grey;
    text-align: left;
  }
}

.border--thin {
  width: 100%;
  border-bottom: 2px solid $c-background-grey;
  margin: 0 auto;
}

.page-actions {
  @include flex-container(row, space-around);
  padding: 1em 0;

  @include breakpoint-above('large') {
    justify-content: flex-end;
  }
}

.page-actions-container {
  padding: 0 2em;
}

.page-numbers {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.page-actions {
  &__stepper {
    display: flex;
    align-items: center;

    margin-right: 1em;
    color: $c-information-blue;

    & .caret path {
      fill: $c-information-blue;
    }

    &:hover {
      cursor: pointer;
    }

    @include breakpoint-above('medium') {
      margin-right: 2em;
    }

    &--disabled {
      margin-right: 1em;
      color: $c-disabled-grey;

      &:hover {
        cursor: default;
      }

      & .caret path {
        fill: $c-disabled-grey;
      }

      @include breakpoint-above('medium') {
        margin-right: 2em;
      }
    }
  }
}

.page-num {
  margin-right: 1em;
  @include breakpoint-above('medium') {
    margin-right: 2em;
  }
  &:hover {
    color: $c-information-blue;
    cursor: pointer;
  }

  &--active {
    color: $c-information-blue;

    &:hover {
      cursor: default;
    }
  }
}

.caret {
  &--previous {
    transform: rotate(90deg);
    margin-right: 0.4em;
  }

  &--next {
    transform: rotate(-90deg);
    margin-left: 0.4em;
  }
}

// mobile css styling
.mobile-container {
  padding: 0.5em 1.5em 0.5em 1.5em;
  margin: 0;
  background-color: white;
  border: 1px solid $c-border-grey;
  border-radius: 8px 8px 16px 16px;
  min-width: 100%;
}

.mobile-session-list {
  padding: 0;
  min-height: 500px;
  &__partner-name {
    font-weight: 500;
    font-size: 14px;
    margin: 0.4em;
    &-container {
      @include flex-container(row, center, center);
    }
  }

  &__session {
    @include flex-container(row, space-between, center);
  }

  &__subject-container {
    @include flex-container(row, initial, center);
  }

  &__created-at {
    color: $c-secondary-grey;
    font-size: 12px;
    font-weight: 400;
  }

  &__createdAt-container {
    @include flex-container(column, center, flex-end);
    margin-left: auto;
  }
}

.mobile-subject {
  text-align: left;
  font-weight: 600;
  font-size: 16px;

  &-icon {
    height: 30px;
    width: 30px;
  }

  &-name-container {
    @include flex-container(column, center, flex-start);
    margin: 1.375em;
  }

  &-time-tutored {
    color: $c-secondary-grey;
    font-size: 12px;
    font-weight: 400;
  }
}
</style>
