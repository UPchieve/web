<script lang="ts" setup>
import { reactive, ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useStore } from 'vuex'
import ViewFavoritesToggle from '@/components/ViewFavoritesToggle.vue'
import NetworkService from '@/services/NetworkService'
import LoggerService from '@/services/LoggerService'
import CaretIcon from '@/assets/caret.svg'
import CoachIcon from '@/assets/user_avatars/volunteer-icon.svg'
import StarIcon from '@/assets/icons/star_icon.svg'
import Loader from '@/components/Loader.vue'
import MyCoachCard from '@/components/MyCoachCard.vue'

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

async function fetchCoaches() {
  isFetchingCoaches.value = true
  try {
    const response = await NetworkService.getPastVolunteers()
    allCoaches.value = response.data.pastVolunteers || []

    applyFilter()
    paginate()
  } catch (err: any) {
    LoggerService.noticeError(err?.response?.data?.err ?? err)
    error.value = 'We were unable to load your coaches. Please try again later.'
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
  await fetchCoaches()
})
</script>

<template>
  <div class="container">
    <section class="header">
      <h1 class="title">My Coaches</h1>
      <p class="subtitle">
        Here's the list of all your coaches! You can use the Favorites toggle to
        see your favorite coaches. Currently, the maximum favorite coaches you
        can have is 20.
      </p>
    </section>
    <div class="filters">
      <view-favorites-toggle
        :value="filters.favoritesOnly"
        :labels="{ checked: 'Favorites', unchecked: 'All coaches' }"
        @change="toggleFavoritesFilter"
      />
    </div>
    <section class="favorite-coaches">
      <div v-if="error" class="info">
        {{ error }}
      </div>
      <loader
        v-else-if="isFetchingCoaches"
        message="Retrieving your coaches"
        class="coaches-loader"
      />
      <template v-else-if="total > 0">
        <MyCoachCard
          v-for="coach in coaches"
          :key="coach.volunteerId"
          class="coach-card"
          :coach="coach"
          :handleFavoriteChange="handleFavoriteChange"
        />
      </template>
      <div v-else class="coach-list">
        <div v-if="filters.favoritesOnly" class="favorite-coaches__no-coaches">
          <star-icon class="star-icon" />
          <h2 class="secondary-header">You can now favorite a coach!</h2>
          <p class="favorite-coaches__no-coaches-description">
            Favoriting a coach will increase your chances of matching with them
            in the future. To favorite a coach you really like, fill out the
            form after your tutoring session.
          </p>
        </div>
        <div v-else class="favorite-coaches__no-coaches">
          <coach-icon class="coach-icon" />
          <h2 class="secondary-header">You haven't had any coaches yet!</h2>
          <p class="favorite-coaches__no-coaches-description">
            Once you've had a tutoring session, your coaches will show up here.
          </p>
        </div>
      </div>
    </section>
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
  </div>
</template>

<style lang="scss" scoped>
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
}

.info {
  @include flex-container(row, center, center);
  font-weight: 500;
  font-size: 22px;
  margin: 3rem 1rem 0 1rem;
  text-align: center;
}

.coaches-loader {
  margin: 3rem 0;
  @include flex-container(column, center, center);
}

.coach-list {
  min-height: 600px;
  padding: 0 2em;
}

.favorite-coaches {
  &__no-coaches {
    @include flex-container(column, normal, center);
    margin: 4em 2em 2em;
    min-height: 60vh;
  }

  &__no-coaches-description {
    text-align: center;
  }
}

.page-actions {
  @include flex-container(row, space-around);
  padding: 1em 0;

  @include breakpoint-above('large') {
    justify-content: flex-end;
  }
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

.coach-card {
  margin: 24px 0;
}
</style>
