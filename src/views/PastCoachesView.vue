<script lang="ts" setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import FavoritingToggle from '@/components/FavoritingToggle.vue'
import ToggleButton from '@/components/ToggleButton.vue'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import CaretIcon from '@/assets/caret.svg'
import CoachIcon from '@/assets/user_avatars/volunteer-icon.svg'
import StarIcon from '@/assets/icons/star_icon.svg'
import Loader from '@/components/Loader.vue'

interface Coach {
  volunteerId: string
  firstName: string
  numSessions: number
  isFavorite: boolean
}

const $route = useRoute()
const $router = useRouter()
const store = useStore()

const mobileMode = computed(() => store.getters['app/mobileMode'])

const allCoaches = ref<Coach[]>([])
const filteredCoaches = ref<Coach[]>([])
const coaches = ref<Coach[]>([])
const filters = reactive({
  favoritesOnly: false,
})
const page = ref(1)
const isLastPage = ref(false)
const isFetchingCoaches = ref(false)
const error = ref('')
const pageBeforeFavoritesFilter = ref<number | null>(null)
const coachLimitPerPage = 5

const isFirstPage = computed(() => page.value === 1)
const total = computed(() => filteredCoaches.value.length)

function setCurrentPageFromQuery(query: typeof $route.query) {
  page.value = parseInt(query.page as string) || 1
  filters.favoritesOnly = query.favoritesOnly === 'true'
}

async function fetchPastCoaches() {
  isFetchingCoaches.value = true
  try {
    const response = await NetworkService.getPastVolunteers()
    allCoaches.value = response.data.pastVolunteers || []

    applyFilter()
    paginate()
  } catch (err: any) {
    LoggerService.noticeError(err?.response?.data?.err ?? err)
    error.value =
      'We were unable to load your past coaches. Please try again later.'
  } finally {
    isFetchingCoaches.value = false
  }
}

function applyFilter() {
  filteredCoaches.value = allCoaches.value.filter(
    (coach) => !filters.favoritesOnly || coach.isFavorite
  )
}

function paginate() {
  const maxPage = Math.max(
    1,
    Math.ceil(filteredCoaches.value.length / coachLimitPerPage)
  )
  if (page.value > maxPage) {
    page.value = maxPage
    if (parseInt($route.query.page as string) !== page.value) {
      $router
        .replace({ query: { ...$route.query, page: page.value } })
        .catch(() => {})
    }
  }

  const start = (page.value - 1) * coachLimitPerPage
  const end = page.value * coachLimitPerPage

  isLastPage.value = end >= filteredCoaches.value.length
  coaches.value = filteredCoaches.value.slice(start, end)
}

//Create a new browser history entry and use as the source of truth for navigating
//using the back button. Steps back through pages and whenever the filter is updated
//instead of going back to the previous view.
function navigateTo(query: { page?: number; favoritesOnly?: boolean }) {
  $router
    .push({
      query: {
        page: query.page ?? page.value,
        favoritesOnly: String(query.favoritesOnly ?? filters.favoritesOnly),
      },
    })
    .catch(() => {})
}

function goToNextPage() {
  if (isLastPage.value) return
  navigateTo({ page: page.value + 1 })
}

function goToPreviousPage() {
  if (isFirstPage.value) return
  navigateTo({ page: page.value - 1 })
}

function toggleFavoritesFilter({ value }: { value: boolean }) {
  if (value) {
    // remember where we were so turning the filter back off can
    // restore it and not go back to page 1
    pageBeforeFavoritesFilter.value = page.value
  }

  const newPage = value ? 1 : pageBeforeFavoritesFilter.value || 1
  if (!value) pageBeforeFavoritesFilter.value = null

  navigateTo({ page: newPage, favoritesOnly: value })
}

function handleFavoriteChange(volunteerId: string, isFavorite: boolean) {
  allCoaches.value = allCoaches.value.map((coach) => ({
    ...coach,
    isFavorite:
      coach.volunteerId === volunteerId ? isFavorite : coach.isFavorite,
  }))
  applyFilter()
  paginate()
}

function getSessionTotalTextDisplay(numSessions: number) {
  return `${numSessions} Session${numSessions !== 1 ? 's' : ''}`
}

// Watch the URL as the source of truth for the current page
// so the back button goes back on step instead of to the previous view
watch(
  () => $route.query,
  (query) => {
    setCurrentPageFromQuery(query)
    applyFilter()
    paginate()
  }
)

onMounted(async () => {
  setCurrentPageFromQuery($route.query)
  await fetchPastCoaches()
})
</script>

<template>
  <div class="container">
    <section class="header">
      <h1 class="title">Your Past Coaches</h1>
      <p class="subtitle">
        Here's the list of all your past coaches! You can use the Favorites
        toggle to see your favorite coaches. Currently, the maximum favorite
        coaches you can have is 20.
      </p>
    </section>
    <div class="filters">
      <label class="filters__favorites-only">
        Favorites only
        <toggle-button
          :value="filters.favoritesOnly"
          :sync="true"
          :labels="{ checked: 'Favorites', unchecked: 'All' }"
          :width="95"
          @change="toggleFavoritesFilter"
          data-testid="favorites-only-toggle"
        />
      </label>
    </div>
    <section class="favorite-coaches">
      <div class="spacing--grid coach-list__headers">
        <span>Coach</span>
        <span v-if="!mobileMode">Total Sessions</span>
        <span>Favorite</span>
      </div>
      <div v-if="error" class="info">
        {{ error }}
      </div>
      <loader
        v-else-if="isFetchingCoaches"
        message="Retrieving your past coaches"
        class="past-coaches-loader"
      />
      <ul class="coach-list" v-else-if="total > 0">
        <li v-for="(coach, index) in coaches" :key="coach.volunteerId">
          <div class="spacing--grid coach-list__coach">
            <div class="coach-list__coach-name-container">
              <coach-icon class="coach-icon" />
              <span v-if="!mobileMode" class="coach-list__coach-name">{{
                coach.firstName
              }}</span>
              <div v-else class="coach-list__coach-name-session">
                <span class="coach-list__coach-name">{{
                  coach.firstName
                }}</span>
                <span>{{ getSessionTotalTextDisplay(coach.numSessions) }}</span>
              </div>
            </div>

            <span v-if="!mobileMode">{{
              getSessionTotalTextDisplay(coach.numSessions)
            }}</span>
            <favoriting-toggle
              :initialIsFavorite="coach.isFavorite"
              :volunteerName="coach.firstName"
              :volunteerId="coach.volunteerId"
              @change-favorited="handleFavoriteChange"
            />
          </div>
          <div class="border--thin" v-if="index !== coaches.length - 1"></div>
        </li>
      </ul>
      <div
        v-else-if="filters.favoritesOnly"
        class="favorite-coaches__no-coaches"
      >
        <star-icon class="star-icon" />
        <h2 class="secondary-header">You can now favorite a coach!</h2>
        <p class="favorite-coaches__no-coaches-description">
          Favoriting a coach will increase your chances of matching with them in
          the future. To favorite a coach you really like, fill out the form
          after your tutoring session.
        </p>
      </div>
      <div v-else class="favorite-coaches__no-coaches">
        <coach-icon class="coach-icon" />
        <h2 class="secondary-header">You haven't had any coaches yet!</h2>
        <p class="favorite-coaches__no-coaches-description">
          Once you've had a tutoring session, your coaches will show up here.
        </p>
      </div>
      <footer class="page-actions-container">
        <div class="border--thin"></div>
        <div class="page-actions" v-if="total > 0">
          <button
            type="button"
            @click="goToPreviousPage"
            :class="{ 'page-actions__stepper--disabled': isFirstPage }"
            class="page-actions__stepper"
            :disabled="isFirstPage"
          >
            <caret-icon class="caret caret--previous" /><span v-if="!mobileMode"
              >Previous</span
            >
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
            <span v-if="!mobileMode">Next</span
            ><caret-icon class="caret caret--next" />
          </button>
        </div>
      </footer>
    </section>
  </div>
</template>

<style lang="scss" scoped>
ul {
  padding: 0px;
  height: 100%;
  margin: auto;
  list-style-type: none;
}

.header {
  text-align: left;
  margin-bottom: 2em;
}

.secondary-header {
  font-size: 1.4rem;
}

.title {
  @include font-category('display-small');
  margin-bottom: 1em;
}

.subtitle {
  @include font-category('body');
  color: $c-secondary-grey;
}

.container {
  padding: 1.5em;
  margin: 0;

  @include breakpoint-above('large') {
    padding: 2.5em;
  }
}

.filters {
  @include flex-container(row, flex-start, center);
  margin-bottom: 1rem;

  &__favorites-only {
    @include flex-container(row, center, center);
    gap: 1em;
    font-weight: 500;
  }
}

.info {
  @include flex-container(row, center, center);
  font-weight: 500;
  font-size: 22px;
  margin: 3rem 1rem 0 1rem;
  text-align: center;
}

.past-coaches-loader {
  margin: 3rem 0;
  @include flex-container(column, center, center);
}

.coach-list {
  min-height: 600px;
  padding: 0 2em;

  &__headers {
    background-color: $c-background-blue;
    padding: 1em 2em;
    border-radius: 8px 8px 0px 0px;
    font-weight: 500;
  }

  &__coach {
    padding: 2.4em 0;

    &-name {
      font-weight: 500;
      text-align: left;

      @include breakpoint-above('medium') {
        width: 100px;
      }
    }

    &-name-container {
      @include flex-container(row, center, center);

      @include breakpoint-above('medium') {
        flex-direction: row;
      }
    }

    &-name-session {
      @include flex-container(column);
      text-align: left;
      margin-left: 1em;
    }
  }
}

.favorite-coaches {
  background-color: $upchieve-white;
  border-radius: 8px;
  border: 1px solid $c-background-blue;

  &__no-coaches {
    @include flex-container(column, normal, center);
    margin: 4em 2em 2em;
    min-height: 60vh;

    &-description {
      max-width: 600px;
      margin-top: 1em;
      color: $c-secondary-grey;
    }
  }
}

.spacing--grid {
  @include flex-container(row, space-around, center);
  display: grid;
  grid-template-columns: 1fr 1fr;
  text-align: center;

  @include breakpoint-above('medium') {
    grid-template-columns: 1fr 1fr 1fr;
  }
}

.page-actions {
  @include flex-container(row, space-around);
  padding: 1em 0;

  @include breakpoint-above('large') {
    justify-content: flex-end;
  }
}

.border--thin {
  width: 95%;
  border-bottom: 2px solid $c-background-grey;
  margin: 0 auto;
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
    background: transparent;
    border: none;
    padding: 0;
    font: inherit;

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

.coach-icon {
  height: 40px;
  width: 40px;

  @include breakpoint-above('medium') {
    margin-right: 1em;
  }
}

.star-icon {
  width: 40px;
  height: 40px;
  margin: 1em 0;

  & path {
    stroke: $c-secondary-grey;
  }
}
</style>
