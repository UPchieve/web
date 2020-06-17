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
      <template v-if="user.isApproved && isOnboarded">
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
                <div class="volunteer-impact__stat-label">
                  {{ stat.label }}:
                </div>
                <div class="volunteer-impact__stat-value">{{ stat.value }}</div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-else>
        <div v-if="!user.isApproved" class="dashboard-card">
          <verification-icon />
          <h3>Volunteer Verification</h3>
          <p>
            Provide proof of identity and provide references to become an
            approved volunteer
          </p>

          <account-action
            title="Proof of identity"
            :subtitle="photoIdAction.subtitle"
            :status="photoIdAction.status"
            @click.native="togglePhotoUploadModal"
          >
            <person-icon />
          </account-action>

          <account-action
            title="Reference check"
            :subtitle="referenceAction.subtitle"
            :status="referenceAction.status"
            @click.native="toggleReferencesModal"
          >
            <person-card-icon />
          </account-action>
        </div>
        <div v-if="!isOnboarded" class="dashboard-card">
          <!-- @todo: user avatar icon -->
          <verification-icon />
          <h3>Set up your account</h3>
          <p>
            Select your availability and take quizes to get certified in various
            subjects!
          </p>
          <div>
            <div v-if="!hasSelectedAvailability" class="onboarding-step">
              <img
                src="@/assets/onboarding_icons/calendar-icon.png"
                class="onboarding-icon"
              />
              <div>
                <h4>Select availability</h4>
                <p>
                  Select at least one hour of availability so that we know when
                  we can text you.
                </p>
              </div>
            </div>
            <div v-if="!hasCertification" class="onboarding-step">
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
      </template>
    </div>

    <photo-upload-modal
      v-if="showPhotoUploadModal"
      :closeModal="togglePhotoUploadModal"
    />

    <references-modal
      v-if="showReferencesModal"
      :closeModal="toggleReferencesModal"
    />
  </div>
</template>

<script>
import _ from "lodash";
import { mapState, mapGetters } from "vuex";
import ListSessions from "./ListSessions";
import DashboardBanner from "../DashboardBanner";
import AccountAction from "./AccountAction";
import PhotoUploadModal from "./PhotoUploadModal";
import ReferencesModal from "./ReferencesModal";
import LargeButton from "@/components/LargeButton";
import PersonCardIcon from "@/assets/person-card.svg";
import PersonIcon from "@/assets/person.svg";
import VerificationIcon from "@/assets/verification.svg";
import { allSubtopicNames } from "@/utils/topics";

const headerData = {
  component: "RejoinSessionHeader",
  data: { important: true }
};

const upchieveTopics = allSubtopicNames();

export default {
  name: "volunteer-dashboard",
  components: {
    ListSessions,
    DashboardBanner,
    AccountAction,
    PhotoUploadModal,
    ReferencesModal,
    LargeButton,
    PersonCardIcon,
    PersonIcon,
    VerificationIcon
  },
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

    this.$store.dispatch("user/fetchVolunteerStats", this);
  },
  data() {
    return {
      showPhotoUploadModal: false,
      showReferencesModal: false
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user,
      isFirstDashboardVisit: state => state.user.isFirstDashboardVisit,
      volunteerStats: state => state.user.volunteerStats
    }),
    ...mapGetters({
      isSessionAlive: "user/isSessionAlive",
      sessionPath: "user/sessionPath",
      isOnboarded: "user/isOnboarded",
      hasCertification: "user/hasCertification",
      hasSelectedAvailability: "user/hasSelectedAvailability"
    }),

    isNewVolunteer() {
      return !this.user.pastSessions || !this.user.pastSessions.length;
    },

    photoIdAction() {
      switch (this.user.photoIdStatus) {
        case "EMPTY":
          return {
            subtitle: "Add photo",
            status: "DEFAULT"
          };
        case "SUBMITTED":
          return {
            subtitle: "In review",
            status: "PENDING"
          };
        case "APPROVED":
          return {
            subtitle: "Completed",
            status: "COMPLETED"
          };
        case "REJECTED":
          return {
            subtitle: "Please upload a different photo",
            status: "ERROR"
          };
        default:
          return {
            subtitle: "Add photo",
            status: "DEFAULT"
          };
      }
    },

    referenceAction() {
      const linkedInStatus = this.user.linkedInStatus;
      const referenceStatuses = this.user.references.map(r => r.status);
      const statuses = [linkedInStatus, ...referenceStatuses].filter(
        s => s !== "EMPTY" // linkedInStatus defaults to "EMPTY"
      );

      if (statuses.length === 0)
        return {
          subtitle: "Add references",
          status: "Default"
        };

      if (statuses.some(s => s === "REJECTED"))
        return {
          subtitle: "Action required",
          status: "ERROR"
        };

      if (statuses.length === 1)
        return {
          subtitle: "Incomplete: 1 out of 2 references submitted",
          status: "PROGRESS"
        };

      if (statuses[0] === "APPROVED" && statuses[1] === "APPROVED")
        return {
          subtitle: "Completed",
          status: "COMPLETED"
        };

      return {
        subtitle: "Pending",
        status: "PENDING"
      };
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
      const numRequestsFilled = _.get(user, "pastSessions.length", "--");

      // (4) Hours tutored
      const numHoursTutored = this.volunteerStats.hoursTutored || "--";

      const numElapsedAvailabilityHours = user.elapsedAvailability;

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
        },
        {
          label: "Hours of elapsed availability",
          value: `${numElapsedAvailabilityHours} hours elapsed`
        }
      ];
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
        component: "VolunteerOnboardingModal",
        data: { alertModal: true, acceptText: "Get started" }
      });
    },
    togglePhotoUploadModal() {
      this.showPhotoUploadModal = !this.showPhotoUploadModal;
    },
    toggleReferencesModal() {
      this.showReferencesModal = !this.showReferencesModal;
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
  padding: 40px 15px;

  @include breakpoint-above("medium") {
    display: inline-flex;
    min-width: 100%;
    padding: 40px;
  }

  &__body {
    @include child-spacing(top, 16px);
    @include child-spacing(right, 0);
    margin-top: 40px;

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
  margin: 1em 0;
  text-align: left;

  & div {
    text-align: left;
    margin-left: 2em;
  }
}

.onboarding-icon {
  width: 70px;
  height: 70px;
  flex-shrink: 0;
}

.icon-ring {
  @include flex-container(row, center, center);
  height: 60px;
  width: 60px;
  border-radius: 50%;
  border: 1px solid $c-border-grey;
}
</style>
