<template>
  <div class="volunteer-dashboard">
    <dashboard-banner>
      <large-button
        v-if="isNewVolunteer"
        primary
        reverse
        @click.native="goToCoachGuide"
        >Get Started</large-button
      >
    </dashboard-banner>

    <div class="volunteer-dashboard__body">
      <div v-if="!user.isOnboarded" class="dashboard-card">
        <div class="dashboard-card__title">Remaining Onboarding Steps</div>
        <div>
          <div v-if="!hasSelectedAvailability" class="onboarding-step">
            <img
              src="@/assets/onboarding_icons/calendar-icon.png"
              class="onboarding-icon"
            />
            <div>
              <h4>Select availability</h4>
              <p>
                Select at least one hour of availability so that we know when we
                can text you.
              </p>
            </div>
          </div>
          <div v-if="!isCertified" class="onboarding-step">
            <img
              src="@/assets/onboarding_icons/quiz-icon.png"
              class="onboarding-icon"
            />
            <div>
              <h4>Get a certification</h4>
              <p>
                Pass at least one quiz so that we know what subjects you can
                help students with.
              </p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="students-waiting dashboard-card">
        <div class="dashboard-card__title">Waiting Students</div>
        <div v-if="isSessionAlive">
          <button
            class="btn rejoinSessionBtn"
            @click.prevent="rejoinHelpSession()"
          >
            Rejoin your coaching session
          </button>
        </div>
        <div v-else>
          <div class="dashboard-card__description">
            Students waiting for help will show up below.
          </div>
          <list-sessions />
        </div>
      </div>
      <div class="dashboard-card">
        <div class="dashboard-card__title">Your Impact Summary</div>

        <div class="volunteer-impact">
          <div class="volunteer-impact__stats">
            <div
              v-for="(stat, statIndex) in impactStats"
              :key="statIndex"
              class="volunteer-impact__stat"
            >
              <div class="volunteer-impact__stat-label">{{ stat.label }}:</div>
              <div class="volunteer-impact__stat-value">{{ stat.value }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import _ from "lodash";
import { mapState, mapGetters } from "vuex";

import ListSessions from "./ListSessions";
import DashboardBanner from "../DashboardBanner";
import LargeButton from "@/components/LargeButton";

import { allSubtopicNames } from "@/utils/topics";

const headerData = {
  component: "RejoinSessionHeader",
  data: { important: true }
};

const upchieveTopics = allSubtopicNames();

export default {
  name: "volunteer-dashboard",
  components: { ListSessions, DashboardBanner, LargeButton },
  watch: {
    isSessionAlive(isAlive) {
      if (!isAlive) {
        this.$store.dispatch("app/header/show");
      } else {
        this.$store.dispatch("app/header/show", headerData);
      }
    }
  },
  created() {
    if (this.isSessionAlive) {
      this.$store.dispatch("app/header/show", headerData);
    }

    if (this.isFirstDashboardVisit) {
      this.showOnboardingModal();
    }
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      isFirstDashboardVisit: state => state.user.isFirstDashboardVisit
    }),
    ...mapGetters({
      isSessionAlive: "user/isSessionAlive",
      sessionPath: "user/sessionPath"
    }),

    isNewVolunteer() {
      return this.user.numPastSessions === 0;
    },

    impactStats() {
      const user = this.$store.state.user.user;
      // (1) Hours selected
      const userHasSchedule = _.chain(user)
        .get("availability.Thursday.5p")
        .isBoolean()
        .value();

      let numHoursSelected = 0;

      if (userHasSchedule) {
        numHoursSelected = _.reduce(
          user.availability,
          (weeklyHourCount, dayHours) => {
            // Tally up num hours for each day
            const hoursSelectedForDay = _.reduce(
              dayHours,
              (dailyHourCount, hourVal) => {
                // Add 1 if hour val is true
                return dailyHourCount + (hourVal ? 1 : 0);
              },
              0
            );

            return weeklyHourCount + hoursSelectedForDay;
          },
          0
        );
      }

      // (2) Certs obtained
      const certsObtained = _.filter(upchieveTopics, topic => {
        return _.get(user, `certifications.${topic}.passed`, false);
      });

      const numCertsObtained = certsObtained.length;

      // (3) Requests filled
      const numRequestsFilled = _.get(user, "numPastSessions", "--");

      // (4) Hours tutored
      const numHoursTutored = _.get(user, "numVolunteerSessionHours", "--");

      return [
        {
          label: "Hours of availability selected",
          value: `${numHoursSelected} hours selected`
        },
        {
          label: "Number of certifications obtained",
          value: `${numCertsObtained} certs obtained`
        },
        {
          label: "Number of requests filled",
          value: `${numRequestsFilled} requests filled`
        },
        {
          label: "Hours of tutoring completed",
          value: `${numHoursTutored} hours tutored`
        }
      ];
    },

    isCertified() {
      let isCertified = false;

      for (let index in this.user.certifications) {
        if (this.user.certifications[index].passed) {
          isCertified = true;
          break;
        }
      }
      return isCertified;
    },

    hasSelectedAvailability() {
      return !!this.user.availabilityLastModifiedAt;
    }
  },
  methods: {
    rejoinHelpSession() {
      const path = this.sessionPath;
      if (path) {
        this.$router.push(path);
      } else {
        this.$router.push("/");
      }
    },

    goToCoachGuide() {
      this.$router.push("/coach-guide");
    },

    showOnboardingModal() {
      this.$store.dispatch("app/modal/show", {
        component: "OnboardingModal",
        data: { alertModal: true, acceptText: "Get started" }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
.btn {
  height: 60px;
  background-color: #16d2aa;
  border: none;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  color: white;
  line-height: 40px;

  &:hover {
    background-color: #16d2aa;
  }

  &:disabled {
    color: white;
  }

  &.rejoinSessionBtn {
    border-radius: 30px;
    width: 300px;
    margin-top: 25px;
  }
}

.volunteer-dashboard {
  @include flex-container(column);
  @include child-spacing(top, 40px);
  padding: 40px 15px;

  @include breakpoint-above("medium") {
    display: inline-flex;
    min-width: 100%;
    padding: 40px;
  }

  &__body {
    @include child-spacing(top, 16px);
    @include child-spacing(right, 0);

    @include breakpoint-above("huge") {
      @include child-spacing(top, 0);
      @include child-spacing(right, 40px);

      @include flex-container(row);

      & > * {
        flex-basis: 50%;
      }
    }
  }
}

.dashboard-card {
  background: #fff;
  border-radius: 8px;
  padding: 40px 10px;

  @include breakpoint-above("medium") {
    padding: 40px 30px;
  }

  &__title {
    margin: 0 0 15px;
    font-size: 24px;
    font-weight: 500;
    line-height: 1.25;
  }

  &__description {
    font-size: 16px;
    color: $c-secondary-grey;
    margin: 15px 0;
  }
}

.volunteer-impact {
  &__stats {
    width: 100%;
    padding: 10px 5px 0;
  }

  &__stat {
    display: flex;
    justify-content: space-between;
    padding: 15px 0;
    font-size: 16px;
  }

  &__stat-value {
    font-weight: bold;
  }
}

.onboarding-step {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;

  &:first-child {
    margin: 2.5em 0 3em;
  }

  & div {
    text-align: left;
    margin-left: 2em;
  }
}

.onboarding-icon {
  width: 70px;
  height: 70px;
}
</style>
