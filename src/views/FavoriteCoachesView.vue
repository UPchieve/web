<template>
  <div class="container">
    <section class="header">
      <h1 class="title">
        Your Favorite Coaches: {{ total }}/{{ favoriteLimit }}
      </h1>
      <p class="subtitle">
        Here's the list of your favorite coaches! Currently, the maximum
        favorite coaches you can have is 20.
      </p>
    </section>
    <section class="favorite-coaches">
      <div class="spacing--grid coach-list__headers">
        <span>Favorite Coach</span>
        <span v-if="!mobileMode">Total Sessions</span>
        <span>Favorite</span>
      </div>
      <ul class="coach-list" v-if="total > 0">
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
                <span
                  >{{getSessionTotalTextDisplay(coach.numSessions)}}</span>
              </div>
            </div>

            <span v-if="!mobileMode"
              >{{getSessionTotalTextDisplay(coach.numSessions)}}</span>
            <favoriting-toggle
              :initialIsFavorite="true"
              :volunteerName="coach.firstName"
              :volunteerId="coach.volunteerId"
            />
          </div>
          <div class="border--thin" v-if="index !== 4"></div>
        </li>
      </ul>
      <div v-else class="favorite-coaches__no-coaches">
        <heart-icon class="heart-icon" />
        <h2 class="secondary-header">You can now favorite a coach!</h2>
        <p class="favorite-coaches__no-coaches-description">
          Favoriting a coach will increase your chances of matching with them in
          the future. To favorite a coach you really like, fill out the form
          after your tutoring session.
        </p>
      </div>
      <footer class="page-actions-container">
        <div class="border--thin"></div>
        <div class="page-actions" v-if="total > 0">
          <div
            @click="() => getFavoriteCoaches(page - 1)"
            :class="isFirstPage && 'page-actions__stepper--disabled'"
            class="page-actions__stepper"
          >
            <caret-icon class="caret caret--previous" /><span v-if="!mobileMode"
              >Previous</span
            >
          </div>
          <div class="page-numbers">
            <span
              v-for="pageNum in totalPages"
              :key="pageNum"
              :class="pageNum === page && 'page-num--active'"
              class="page-num"
              @click="() => handlePageClick(pageNum)"
            >
              {{ pageNum }}
            </span>
          </div>
          <div
            @click="() => getFavoriteCoaches(page + 1)"
            :class="isLastPage && 'page-actions__stepper--disabled'"
            class="page-actions__stepper"
          >
            <span v-if="!mobileMode">Next</span
            ><caret-icon class="caret caret--next" />
          </div>
        </div>
      </footer>
    </section>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import FavoritingToggle from '@/components/FavoritingToggle'
import NetworkService from '@/services/NetworkService'
import CaretIcon from '@/assets/caret.svg'
import CoachIcon from '@/assets/volunteer-icon.svg'
import HeartIcon from '@/assets/heart.svg'

export default {
  name: 'favorite-coaches-view',
  components: {
    FavoritingToggle,
    CaretIcon,
    CoachIcon,
    HeartIcon,
  },
  data() {
    return {
      coaches: [],
      page: 1,
      total: 0,
    }
  },
  async created() {
    await Promise.all([
      this.getFavoriteCoaches(this.page),
      this.getTotalFavoriteCoaches(),
    ])
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    isFirstPage() {
      return this.page === 1
    },
    favoriteLimit() {
      return 20
    },
    totalPages() {
      const coachLimitPerPage = 5
      const totalPages = Math.ceil(this.total / coachLimitPerPage)
      return totalPages === 0 ? 1 : totalPages
    },
    isLastPage(){
      return this.page === this.totalPages
    }
  },
  methods: {
    async getFavoriteCoaches(page) {
      if (page < 1 || page > this.totalPages) return
      const response = await NetworkService.getFavoriteVolunteers(page)
      this.coaches = response.data.favoriteVolunteers
      this.page = page
    },
    async getTotalFavoriteCoaches() {
      const response = await NetworkService.getRemainingFavoriteVolunteers()
      this.total = this.favoriteLimit - response.data.remaining
    },
    async handlePageClick(page) {
      if (this.page === page) return
      await this.getFavoriteCoaches(page)
    },
    getSessionTotalTextDisplay(numSessions){
      return `${numSessions} Session${numSessions > 1 ? 's' : ''}`
    }
  },
}
</script>

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
  font-weight: 500;
  font-size: 22px;
  margin-bottom: 1em;
}

.subtitle {
  @include font-category('heading');
  color: $c-secondary-grey;
}

.container {
  padding: 1.5em;
  margin: 0;

  @include breakpoint-above('large') {
    padding: 2.5em;
  }
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
  @include breakpoint-above('medium') {
    margin-right: 1em;
  }
}

.heart-icon {
  width: 40px;
  height: 40px;
  margin: 1em 0;

  & path {
    stroke: $c-secondary-grey;
  }
}
</style>
