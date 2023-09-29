<template>
  <div class="level-system">
    <div @click="toggleModal" class="level-system-container">
      <updog-star class="updog" />
      <div class="level-system-body">
        <div class="level-system-status__level">Level: {{ getLevel }}</div>
        <div class="level-system-status__experience-needed">
          {{ Math.floor(expToNextLevel - userExperienceLevel) }}
          points needed to reach level {{ getLevel + 1 }}
        </div>

        <div class="level-system__progress-bar training__progress-bar">
          <div
            class="training__progress-bar--bg"
            :style="{ width: progressBarNumber + '%' }"
          >
            <span
              class="training__progress-bar--number"
              :class="{
                'training__progress-bar--number-center': progressBarNumber < 30,
              }"
              >{{ progressBarNumber }}%</span
            >
          </div>
        </div>
      </div>
      <arrow-icon class="arrow-icon" />
    </div>
    <modal :closeModal="closeModal" v-if="showModal">
      <div class="level-system-modal">
        <header>
          <h1 class="level-system-modal__title">
            Let's reach level {{ getLevel + 1 }}!
          </h1>
          <updog-hooray class="updog" />
        </header>

        <div class="level-system-modal__progress-bar training__progress-bar">
          <div
            class="training__progress-bar--bg"
            :style="{ width: progressBarNumber + '%' }"
          >
            <span
              class="training__progress-bar--number"
              :class="{
                'training__progress-bar--number-center': progressBarNumber < 30,
              }"
              >{{ progressBarNumber }}%</span
            >
          </div>
        </div>

        <section class="level-system-modal__section">
          <p class="level-system-modal__subtitle">How does it work?</p>
          <p class="level-system-modal__message">
            Earn experience points by participating in tutoring sessions. The
            more sessions and time spent in sessions you have, the more points
            that you get!
          </p>
        </section>
        <separator />
        <footer class="level-system-modal__footer">
          <div class="level-system-modal__buttons">
            <large-button
              @click.native="closeModal"
              class="level-system-modal__buttons-button"
              >Close</large-button
            >
          </div>
        </footer>
      </div>
    </modal>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Modal from '@/components/Modal.vue'
import LargeButton from './LargeButton.vue'
import Separator from './Separator.vue'
import ArrowIcon from '@/assets/arrow.svg'
import UpdogStar from '@/assets/updog-star.svg'
import UpdogHooray from '@/assets/updog-hooray.svg'

export default {
  name: 'LevelSystem',
  components: {
    Modal,
    LargeButton,
    Separator,
    ArrowIcon,
    UpdogStar,
    UpdogHooray,
  },
  data() {
    return {
      showModal: false,
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    experienceConstant() {
      return 0.06
    },
    progressBarNumber() {
      return Math.floor((this.userExperienceLevel / this.expToNextLevel) * 100)
    },
    expToNextLevel() {
      const rawLevel =
        this.experienceConstant * Math.sqrt(this.userExperienceLevel)
      const level = Math.floor(rawLevel)
      const nextPointsForLevel = Math.pow(
        (level + 1) / this.experienceConstant,
        2
      ).toFixed(2)
      return Number(nextPointsForLevel)
    },
    getLevel() {
      // This will give me what I wanta next for experience points, but I need to get levels
      const rawLevel =
        this.experienceConstant * Math.sqrt(this.userExperienceLevel)
      const level = Math.floor(rawLevel)
      return level
    },
    userExperienceLevel() {
      const experiencePerSession = 200
      const experiencePerMinute = 25
      const totalMinutesSpentInSession = this.user.totalTimeTutored / 60000
      const timeTutoredExperience =
        totalMinutesSpentInSession * experiencePerMinute

      const totalSessionExperience =
        this.user.totalTutoredSessions * experiencePerSession

      return Number((timeTutoredExperience + totalSessionExperience).toFixed(2))
    },
  },
  methods: {
    toggleModal() {
      this.showModal = true
    },
    closeModal() {
      this.showModal = false
    },
  },
}
</script>

<style lang="scss" scoped>
.level-system {
  @include flex-container(column, center, center);
  background-color: $upchieve-white;
  border-radius: 0.5em;

  &-container {
    padding: 1em;
    @include flex-container(row, space-around, center);
    width: 100%;
    border: 1px solid transparent;

    &:hover {
      border-color: $c-success-green;
      border: 1px solid $c-success-green;
      cursor: pointer;
      background-color: $selected-green;
      border-radius: 0.5em;

      & .arrow-icon {
        fill: $c-success-green;
      }
    }
  }

  &-body {
    padding: 0 2em;
  }

  &-modal {
    &__buttons {
      &-button {
        margin: 1em auto;
      }
    }
  }

  &-status {
    &__level {
      font-weight: 600;
    }

    &__experience-needed {
      color: $c-secondary-grey;
      font-size: 12px;
    }
  }

  &__progress-bar {
    margin-top: 1em;
  }

  &-modal {
    &__progress-bar {
      width: 100%;
      margin: 1em 0;
    }

    &__subtitle {
      @include font-category('display-small');
      color: $c-secondary-grey;
      margin-top: 1em;
    }
  }
}

.updog {
  width: 100px;
  height: 100px;
}
.arrow-icon {
  width: 20px;
  height: 20px;
}
</style>
