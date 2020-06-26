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
      <template v-if="user.isApproved && user.isOnboarded">
        <div class="dashboard-card">
          <div class="students-waiting">
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
              <div class="dashboard-card__subtitle">
                Students waiting for help will show up below.
              </div>
              <list-sessions />
            </div>
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
          <div class="dashboard-card__icon">
            <verification-icon />
          </div>
          <div class="dashboard-card__title">Volunteer verification</div>
          <div class="dashboard-card__subtitle">
            Provide proof of identity and references to become an approved
            volunteer
          </div>

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
        <div class="dashboard-card">
          <div class="dashboard-card__icon">
            <onboarding-icon />
          </div>
          <div class="dashboard-card__title">Set up your account</div>
          <div class="dashboard-card__subtitle">
            Select your availability and take quizes to get certified in various
            subjects!
          </div>

          <account-action
            title="Select availability"
            :subtitle="availabilityAction.subtitle"
            :status="availabilityAction.status"
            @click.native="clickAvailabilityAction"
          >
            <calendar-icon />
          </account-action>

          <account-action
            title="Get a certification"
            :subtitle="certificationAction.subtitle"
            :status="certificationAction.status"
            @click.native="clickCertificationAction"
          >
            <certification-icon />
          </account-action>
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

    <volunteer-welcome-modal
      v-if="showWelcomeModal"
      :closeModal="toggleWelcomeModal"
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
import VolunteerWelcomeModal from "@/views/DashboardView/VolunteerDashboard/VolunteerWelcomeModal.vue";
import LargeButton from "@/components/LargeButton";
import PersonCardIcon from "@/assets/person-card.svg";
import PersonIcon from "@/assets/person.svg";
import CalendarIcon from "@/assets/calendar.svg";
import CertificationIcon from "@/assets/certification.svg";
import VerificationIcon from "@/assets/verification.svg";
import OnboardingIcon from "@/assets/onboarding.svg";
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
    CalendarIcon,
    CertificationIcon,
    VerificationIcon,
    OnboardingIcon,
    VolunteerWelcomeModal
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
      this.toggleWelcomeModal();
    }

    this.$store.dispatch("user/fetchVolunteerStats", this);
  },
  data() {
    return {
      showPhotoUploadModal: false,
      showReferencesModal: false,
      showWelcomeModal: false
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
      const statuses = this.user.references.map(r => r.status);

      if (statuses.length === 0)
        return {
          subtitle: "Add references",
          status: "DEFAULT"
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

    availabilityAction() {
      if (this.hasSelectedAvailability)
        return {
          subtitle: "Completed",
          status: "COMPLETED"
        };

      return {
        subtitle: "Select at least one hour",
        status: "DEFAULT"
      };
    },

    certificationAction() {
      if (this.hasCertification)
        return {
          subtitle: "Completed",
          status: "COMPLETED"
        };

      return {
        subtitle: "Take a quiz",
        status: "DEFAULT"
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
    toggleWelcomeModal() {
      this.showWelcomeModal = !this.showWelcomeModal;
    },
    togglePhotoUploadModal() {
      this.showPhotoUploadModal = !this.showPhotoUploadModal;
    },
    toggleReferencesModal() {
      this.showReferencesModal = !this.showReferencesModal;
    },
    clickAvailabilityAction() {
      this.$router.push("/calendar");
    },
    clickCertificationAction() {
      this.$router.push("/training");
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
  padding: 40px 0 24px;

  &__icon {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 24px;
  }

  &__title {
    margin-bottom: 4px;
    font-size: 24px;
    font-weight: 500;
    line-height: 1.25;
  }

  &__subtitle {
    font-size: 16px;
    color: $c-secondary-grey;
    margin-bottom: 24px;
    padding: 0 15px;

    @include breakpoint-above("medium") {
      padding: 0 42px;
    }
  }

  .account-action {
    margin: 0 10px;

    @include breakpoint-above("medium") {
      margin: 0 20px;
    }
  }
}

.students-waiting {
  padding: 0;

  @include breakpoint-above("medium") {
    padding: 0 30px;
  }
}

.volunteer-impact {
  padding: 0 10px;

  @include breakpoint-above("medium") {
    padding: 0 30px;
  }

  &__stats {
    width: 100%;
    padding: 10px 5px 0;
  }

  &__stat-label {
    text-align: left;
  }

  &__stat {
    display: flex;
    justify-content: space-between;
    padding: 15px 0;
    font-size: 16px;
  }

  &__stat-value {
    font-weight: bold;
    text-align: right;
  }
}
</style>
