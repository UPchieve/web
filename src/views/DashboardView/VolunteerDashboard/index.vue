<template>
  <div class="volunteer-dashboard">
    <dashboard-banner />

    <div class="volunteer-dashboard__body">
      <div class="students-waiting dashboard-card">
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

import UserService from "@/services/UserService";

import ListSessions from "./ListSessions";
import DashboardBanner from "../DashboardBanner";

const headerData = {
  component: "RejoinSessionHeader",
  data: { important: true }
};

const upchieveTopics = [
  "algebra",
  "applications",
  "biology",
  "calculus",
  "chemistry",
  "esl",
  "essays",
  "geometry",
  "planning",
  "precalculus",
  "trigonometry"
];

export default {
  name: "volunteer-dashboard",
  components: { ListSessions, DashboardBanner },
  watch: {
    isSessionAlive(isAlive) {
      if (!isAlive) {
        this.$store.dispatch("app/header/show");
      } else {
        this.$store.dispatch("app/header/show", headerData);
      }
    }
  },
  data() {
    return {
      user: {},
      name: "Student",
      impactStats: [{ label: "Loading..." }]
    };
  },
  created() {
    UserService.getUser(this)
      .then(user => user || {})
      .then(user => {
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
          return _.get(user, `${topic}.passed`, false);
        });

        const numCertsObtained = certsObtained.length;

        // (3) Requests filled
        const numRequestsFilled = _.get(user, "numPastSessions", "?");

        // (4) Hours tutored
        const numHoursTutored = _.get(user, "numVolunteerSessionHours", "?");

        const impactStats = [
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
        this.user = user;
        this.name = user.firstname || "Student";
        this.impactStats = impactStats;

        if (this.isSessionAlive) {
          this.$store.dispatch("app/header/show", headerData);
        }
      });
  },
  computed: {
    ...mapState({
      sessionPath: state => state.user.sessionPath
    }),
    ...mapGetters({
      isSessionAlive: "user/isSessionAlive"
    })
  },
  methods: {
    rejoinHelpSession() {
      const path = this.sessionPath;
      if (path) {
        this.$router.push(path);
      } else {
        this.$router.push("/");
      }
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
</style>
