<template>
  <div class="session-history">
    <div class="header-container">
      <h1>
        {{ title }}
        <a
          v-if="isFilteredFromSession"
          class="uc-link ml-4"
          @click="clearFilters"
          >See all session history</a
        >
      </h1>
      <p>
        {{
          isVolunteer
            ? 'On this page you can review your past sessions on UPchieve'
            : `On this page you can review your past sessions on UPchieve and favorite
        your preferred Academic Coaches. We'll do our best to pair you with your
        favorited coaches when they're available.`
        }}
      </p>
    </div>
    <div v-if="!isFilteredFromSession" class="filters">
      <form @submit.prevent="filter" class="filters-form" autocomplete="off">
        <FormSearchableSelect
          v-model="filters.firstName"
          name="firstName"
          :placeholder="`${isVolunteer ? 'Student' : 'Coach'} First Name`"
          :is-required="false"
          :options="firstNames"
          @update:modelValue="filter"
          class="filter-input"
        />
        <form-select
          v-if="subjectsByTopics.length"
          v-model="filters.subjectName"
          name="subject"
          class="filter-input"
          placeholder="Subject"
          :options="subjectsByTopics"
          :multiple="false"
          optionTextField="displayName"
          groupField="topicName"
          group="subjects"
          :reduce="(option) => option.displayName"
          @update:modelValue="filter"
        />
        <div class="unread-dms-checkbox" v-if="isShowDMNotificationsEnabled">
          <label>
            <input
              type="checkbox"
              v-model="filters.hasUnreadDMs"
              @change="filter"
            />
            Sessions with unread messages
          </label>
        </div>
        <button type="button" class="clear-filters" @click="clearFilters">
          Clear all
        </button>
      </form>
    </div>

    <div v-if="!mobileMode" class="session-container">
      <section>
        <div class="spacing--grid spacing--grid-4 session-list__headers">
          <span>SUBJECT</span>
          <span>DATE</span>
          <span>{{ isVolunteer ? 'STUDENT' : 'COACH' }}</span>
          <span></span>
        </div>
        <div v-if="error" class="info">
          {{ error }}
        </div>
        <loader
          v-else-if="isFetchingSessions"
          message="Retrieving your session history"
          class="session-history-loader"
        />
        <div v-else-if="!this.sessions.length" class="info">
          You haven't had any sessions matching the filters.
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
                  v-if="isStudent"
                  :initialIsFavorite="session.isFavorited"
                  :volunteerName="session.volunteerFirstName"
                  :volunteerId="session.volunteerId"
                  v-on:change-favorited="updateFavoritedVolunteers"
                />
                <span class="session-list__partner-name">
                  {{
                    isVolunteer
                      ? session.studentFirstName
                      : session.volunteerFirstName
                  }}
                </span>
              </div>
              <div class="session-list__session-recap">
                <large-button
                  v-if="canRequestSessionWith(session)"
                  variant="primary-blue"
                  :showArrow="false"
                  class="request-tutor-button"
                  @click="openRequestSessionModal(session)"
                  >Request {{ session.volunteerFirstName }} again</large-button
                >
                <large-button
                  variant="outlined"
                  @click="
                    routeToSessionRecap(
                      session.id,
                      sessionsWithUnreadDMs.includes(session.id) &&
                        isShowDMNotificationsEnabled
                    )
                  "
                  ><span
                    v-if="
                      sessionsWithUnreadDMs.includes(session.id) &&
                      isShowDMNotificationsEnabled
                    "
                    ><bell-icon class="bell-icon" />New Message</span
                  ><span v-else>Session Recap</span></large-button
                >
              </div>
            </div>
            <div class="border--thin" v-if="index !== 5"></div>
          </li>
        </ul>
        <footer class="page-actions-container">
          <div class="page-actions">
            <button
              type="button"
              @click="goToPreviousPage"
              :class="{ 'page-actions__stepper--disabled': isFirstPage }"
              class="page-actions__stepper"
              :disabled="isFirstPage"
            >
              <caret-icon class="caret caret--previous" /><span>Previous</span>
            </button>
            <div class="page-numbers">
              <span class="page-num page-num--active">
                {{ page }}
              </span>
            </div>
            <button
              type="button"
              @click="goToNextPage"
              :class="{ 'page-actions__stepper--disabled': isLastPage }"
              class="page-actions__stepper"
              :disabled="isLastPage"
            >
              <span>Next</span><caret-icon class="caret caret--next" />
            </button>
          </div>
        </footer>
      </section>
    </div>
    <div v-if="mobileMode">
      <div class="mobile-container">
        <section>
          <div v-if="error" class="info">
            {{ error }}
          </div>
          <loader
            v-else-if="isFetchingSessions"
            message="Retrieving your session history"
            class="session-history-loader"
          />
          <div v-else-if="!this.sessions.length" class="info">
            You don't haven't had any sessions matching the filters.
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
                      v-if="isStudent"
                      :initialIsFavorite="session.isFavorited"
                      :volunteerName="session.volunteerFirstName"
                      :volunteerId="session.volunteerId"
                      v-on:change-favorited="updateFavoritedVolunteers"
                    />
                    <span class="mobile-session-list__partner-name">
                      {{
                        isVolunteer
                          ? session.studentFirstName
                          : session.volunteerFirstName
                      }}
                    </span>
                  </div>
                  <span class="mobile-session-list__created-at">
                    {{ getSessionTimeForMobile(session.createdAt) }}</span
                  >
                  <large-button
                    v-if="canRequestSessionWith(session)"
                    class="request-tutor-button request-tutor-button--mobile"
                    primary
                    @click="openRequestSessionModal(session)"
                    >Request session with
                    {{ session.volunteerFirstName }}</large-button
                  >
                </div>
                <caret-icon
                  class="caret--next"
                  @click="
                    routeToSessionRecap(
                      session.id,
                      sessionsWithUnreadDMs.includes(session.id) &&
                        isShowDMNotificationsEnabled
                    )
                  "
                />
              </div>
              <div class="border--thin" v-if="index !== 5"></div>
            </li>
          </ul>
          <footer class="page-actions-container">
            <div class="page-actions">
              <button
                type="button"
                @click="goToPreviousPage"
                :class="isFirstPage && 'page-actions__stepper--disabled'"
                class="page-actions__stepper"
                :disabled="isFirstPage"
              >
                <caret-icon class="caret caret--previous" />
              </button>
              <div class="page-numbers">
                <span class="page-num page-num--active">
                  {{ page }}
                </span>
              </div>
              <button
                type="button"
                @click="goToNextPage"
                :class="isLastPage && 'page-actions__stepper--disabled'"
                class="page-actions__stepper"
                :disabled="isLastPage"
              >
                <caret-icon class="caret caret--next" />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  </div>
</template>

<script>
import { dayjs } from '@/utils/time-utils'
import { mapGetters, mapState } from 'vuex'
import { EVENTS } from '@/consts'
import CaretIcon from '@/assets/caret.svg'
import AnalyticsService from '@/services/AnalyticsService'
import LoggerService from '@/services/LoggerService'
import NetworkService from '@/services/NetworkService'
import FavoritingToggle from '@/components/FavoritingToggle.vue'
import FormSelect from '@/components/FormInputs/FormSelect.vue'
import FormSearchableSelect from '@/components/FormInputs/FormSearchableSelect.vue'
import LargeButton from '@/components/LargeButton.vue'
import Loader from '@/components/Loader.vue'
import BellIcon from '@/assets/BellIcon.svg'

export default {
  name: 'session-history-view',
  components: {
    CaretIcon,
    FavoritingToggle,
    FormSelect,
    LargeButton,
    Loader,
    FormSearchableSelect,
    BellIcon,
  },
  data() {
    return {
      sessions: [],
      filters: {
        firstName: '',
        subjectName: '',
        studentId: '',
        volunteerId: '',
        filteredSessions: [],
        hasUnreadDMs: false,
      },
      page: 1,
      isFetchingSessions: false,
      isLastPage: false,
      error: '',
      allSessions: [],
      sessionLimitPerPage: 5,
    }
  },
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isVolunteer: 'user/isVolunteer',
      isStudent: 'user/isStudent',
      sessionPartner: 'user/sessionPartner',
      subjectsByTopics: 'subjects/subjectsByTopics',
      sessionsWithUnreadDMs: 'user/sessionsWithUnreadDMs',
      isShowDMNotificationsEnabled: 'featureFlags/isShowDMNotificationsEnabled',
      isStudentsInitiateDmsEnabled: 'featureFlags/isStudentsInitiateDmsEnabled',
      isStudentRequestSpecificVolunteerSessionsEnabled:
        'featureFlags/isStudentRequestSpecificVolunteerSessionsEnabled',
      hasCooldown: 'session/hasCooldown',
    }),
    ...mapState({
      subjectsMap: (state) => state.subjects.subjects,
      currentSession: (state) => state.user.session,
    }),
    isFirstPage() {
      return this.page === 1
    },
    isFilteredFromSession() {
      return this.$route.query.studentId && this.$route.query.volunteerId
    },
    title() {
      return this.isFilteredFromSession
        ? `Session History with ${this.sessionPartner.firstname}`
        : `Session History`
    },
    firstNames() {
      const sessionFirstNames = new Set()
      const firstName = this.isVolunteer
        ? 'studentFirstName'
        : 'volunteerFirstName'
      this.allSessions.forEach((session) => {
        if (!sessionFirstNames.has(session[firstName])) {
          sessionFirstNames.add(session[firstName])
        }
      })
      return Array.from(sessionFirstNames.values())
    },
  },
  async created() {
    const {
      query: { page, firstName, subjectName, studentId, volunteerId },
    } = this.$route

    this.page = parseInt(page ?? this.page)
    this.filters.studentId = studentId ?? this.filters.studentId
    this.filters.volunteerId = volunteerId ?? this.filters.volunteerId
    this.filters.firstName = firstName ?? this.filters.firstName
    this.filters.subjectName = subjectName ?? this.filters.subjectName

    await this.fetchSessionHistory()
  },
  methods: {
    goToNextPage() {
      if (this.isLastPage) return

      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_NEXT_SESSION_HISTORY_PAGE
      )

      this.page++
      this.paginate()
    },
    goToPreviousPage() {
      if (this.page === 0) return

      AnalyticsService.captureEvent(
        EVENTS.USER_CLICKED_PREVIOUS_SESSION_HISTORY_PAGE
      )
      this.page--
      this.paginate()
    },
    clearFilters() {
      this.filters.firstName = ''
      this.filters.subjectName = ''
      this.filters.studentId = ''
      this.filters.volunteerId = ''
      this.filters.hasUnreadDMs = false
      this.page = 1

      this.filter()
    },
    filter() {
      this.$router.push({
        query: { page: this.page, ...this.filters },
      })

      const { firstName, subjectName, studentId, volunteerId } = this.filters

      const filtered = this.allSessions.filter((session) => {
        const matchesName =
          !firstName ||
          session[
            this.isVolunteer ? 'studentFirstName' : 'volunteerFirstName'
          ] === firstName
        const matchesSubject = !subjectName || session.subject === subjectName
        const matchesStudent = !studentId || session.studentId === studentId
        const matchesVolunteer =
          !volunteerId || session.volunteerId === volunteerId

        const hasUnreadDMs =
          !this.filters.hasUnreadDMs ||
          (this.sessionsWithUnreadDMs.includes(session.id) &&
            this.isShowDMNotificationsEnabled)

        return (
          matchesName &&
          matchesSubject &&
          matchesStudent &&
          matchesVolunteer &&
          hasUnreadDMs
        )
      })

      this.filters.filteredSessions = filtered
      this.page = 1
      this.paginate()
    },
    paginate() {
      this.$router.push({
        query: { page: this.page, ...this.filters },
      })

      const start = (this.page - 1) * this.sessionLimitPerPage
      const end = this.page * this.sessionLimitPerPage

      this.isLastPage = end >= this.filters.filteredSessions.length
      this.sessions = this.filters.filteredSessions.slice(start, end)
    },
    async fetchSessionHistory() {
      this.isFetchingSessions = true
      try {
        const queryFilters = {
          [`${this.isVolunteer ? 'student' : 'volunteer'}FirstName`]:
            this.filters.firstName,
          subjectName: this.filters.subjectName,
          studentId: this.filters.studentId,
          volunteerId: this.filters.volunteerId,
        }
        const {
          data: { pastSessions },
        } = await NetworkService.getSessionHistory(queryFilters)
        this.allSessions = pastSessions

        this.filter()
      } catch (error) {
        LoggerService.noticeError(error.response.data.err)
        this.error =
          'We were unable to load your history. Please try again later.'
      } finally {
        this.isFetchingSessions = false
      }
    },
    getSessionTime(sessionCreatedAt) {
      return dayjs(sessionCreatedAt).format('l @ h:mm A')
    },
    getSessionTimeForMobile(sessionCreatedAt) {
      return dayjs(sessionCreatedAt).format('l h:mm A')
    },
    getSessionDuration(timeTutored) {
      const duration = Math.ceil(timeTutored / (1000 * 60))
      return duration
    },
    updateFavoritedVolunteers(volunteerId, isFavorited) {
      this.sessions = this.sessions.map((session) => ({
        ...session,
        isFavorited:
          session.volunteerId === volunteerId
            ? isFavorited
            : session.isFavorited,
      }))
    },
    routeToSessionRecap(sessionId, hasNewMessage) {
      if (hasNewMessage && this.isStudent) {
        AnalyticsService.captureEvent(EVENTS.STUDENT_CLICKED_NEW_MESSAGE)
      } else if (hasNewMessage && this.isVolunteer) {
        AnalyticsService.captureEvent(EVENTS.VOLUNTEER_CLICKED_NEW_MESSAGE)
      }
      this.$router.push(`/sessions/${sessionId}/recap`)
    },
    canRequestSessionWith(session) {
      return (
        this.isStudent &&
        this.isStudentsInitiateDmsEnabled &&
        this.isStudentRequestSpecificVolunteerSessionsEnabled &&
        !!session.volunteerId &&
        !!session.volunteerFirstName &&
        !this.currentSession?.id &&
        !this.hasCooldown
      )
    },
    openRequestSessionModal(session) {
      const matchedSubject = Object.values(this.subjectsMap).find(
        (s) =>
          s.topicName === session.topic && s.displayName === session.subject
      )
      if (!matchedSubject) return

      AnalyticsService.captureEvent(
        EVENTS.STUDENT_CLICKED_REQUEST_TUTOR_AGAIN,
        {
          sourceView: 'session-history',
          requestedVolunteerId: session.volunteerId,
          subject: matchedSubject.name,
          topic: session.topic,
          pastSessionId: session.id,
        }
      )

      // Lock the request to the past session's subject — no picker for this
      // flow. Backend trusts the locked subject (no certification re-check),
      // so the modal must not offer alternatives.
      const subtopics = [matchedSubject.name]
      const subtopicDisplayNames = {
        [matchedSubject.name]: matchedSubject.displayName,
      }

      this.$store.dispatch('app/modal/show', {
        component: 'SubjectSelectionModal',
        data: {
          backText: 'Session History',
          acceptText: 'Continue',
          topic: session.topic,
          title: matchedSubject.topicDisplayName || '',
          subtopics,
          subtopicDisplayNames,
          preSelectedSubtopic: matchedSubject.name,
          subtitle: `Start a ${matchedSubject.displayName} session with ${session.volunteerFirstName}.`,
          sessionArgs: { requestedVolunteerId: session.volunteerId },
        },
      })
    },
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
.session-history {
  padding: 2.5rem;

  @include breakpoint-below('large') {
    padding: 1em;
  }

  &-loader {
    margin: 1em 0;
    @include flex-container(column, center, center);
  }
}

.header-container {
  margin-bottom: 2rem;

  h1 {
    @include font-category('display-small');
    margin-bottom: 1rem;
  }

  @include breakpoint-below('small') {
    margin-bottom: 1rem;
  }

  p {
    @include font-category('body');
    color: $c-secondary-grey;
  }
}

.filters {
  margin-bottom: 1rem;
  width: 100%;

  .btn-container {
    @include flex-container(row, space-between, center);
    gap: 1rem;
  }
}

.filters-form {
  @include flex-container(row, flex-start, center);
  gap: 16px;
  width: 100%;
}

.filter-input {
  max-width: 300px;
}

.clear-filters {
  color: $c-information-blue;
  font-weight: 600;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  line-height: 1;
  // `.uc-form-element` has a 10px top margin - need to match for alignment
  margin-top: 10px;
}
.info {
  @include flex-container(row, center, center);
  font-weight: 500;
  font-size: 22px;
  margin: 3rem 1rem 0 1rem;
  text-align: center;
}

.session-container {
  background-color: white;
  border: 1px solid $c-border-grey;
  border-radius: 20px;
  overflow: hidden;
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
    @include flex-container(row, flex-end, center);
    gap: 12px;
  }
}

.subject {
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
  border-radius: 20px;
  min-width: 100%;
}

.mobile-session-list {
  padding: 0;

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

.see-all-link {
  font-size: 18px;
}

.unread-dms-checkbox {
  margin-top: 10px;
}

.bell-icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}
</style>
