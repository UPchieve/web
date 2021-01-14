<template>
  <div class="volunteer-dashboard">
    <dashboard-banner />

    <div v-if="showUpchieve101Notice" class="dashboard-notice">
      <router-link to="training/course/upchieve101"
        >Please complete UPchieve 101 to remain an active coach →</router-link
      >
    </div>

    <div class="volunteer-dashboard__body">
      <template v-if="user.isApproved && user.isOnboarded">
        <div class="dashboard-card">
          <div class="students-waiting">
            <web-notifications-button class="notifications-button" />
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

          <a
            class="track-hours-link"
            href="https://upc-training-materials.s3.us-east-2.amazonaws.com/volunteer-hour-tracking-guide.pdf"
            target="_blank"
            rel="noopener noreferrer"
            >How to track your volunteer hours <arrow-icon class="arrow-icon" />
          </a>
        </div>
      </template>
      <template v-else>
        <div v-if="!user.isApproved" class="dashboard-card">
          <div class="dashboard-card__icon">
            <verification-icon />
          </div>
          <div class="dashboard-card__title">Approval process</div>
          <div class="dashboard-card__subtitle">
            {{ approvalCardSubheader }}
          </div>
          <template v-if="!user.volunteerPartnerOrg">
            <account-action
              v-for="accountAction in openVolunteerApprovalAccountActions"
              :key="accountAction.title"
              :title="accountAction.title"
              :subtitle="accountAction.subtitle"
              :status="accountAction.status"
              :icon="accountAction.icon"
              @click.native="accountAction.clickFn"
            />
          </template>
          <template v-else>
            <account-action
              v-for="accountAction in partnerVolunteerApprovalAccountActions"
              :key="accountAction.title"
              :title="accountAction.title"
              :subtitle="accountAction.subtitle"
              :status="accountAction.status"
              :icon="accountAction.icon"
              @click.native="accountAction.clickFn"
            />
          </template>
        </div>
        <div class="dashboard-card">
          <div class="dashboard-card__icon">
            <onboarding-icon />
          </div>
          <div class="dashboard-card__title">Onboarding process</div>
          <div class="dashboard-card__subtitle">
            Before you can begin helping students, you’ll need to complete our
            volunteer onboarding process.
          </div>

          <account-action
            v-for="accountAction in onboaringAccountActions"
            :key="accountAction.title"
            :title="accountAction.title"
            :subtitle="accountAction.subtitle"
            :status="accountAction.status"
            :icon="accountAction.icon"
            @click.native="accountAction.clickFn"
          />
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
import PersonCardIcon from "@/assets/person-card.svg";
import PersonIcon from "@/assets/person.svg";
import ReferencesIcon from "@/assets/references-icon.svg";
import CalendarIcon from "@/assets/calendar.svg";
import CertificationIcon from "@/assets/certification.svg";
import VerificationIcon from "@/assets/verification.svg";
import OnboardingIcon from "@/assets/onboarding.svg";
import TrainingIcon from "@/assets/training_icon.svg";
import { allSubtopicNames } from "@/utils/topics";
import WebNotificationsButton from "@/components/WebNotificationsButton.vue";
import ArrowIcon from "@/assets/arrow.svg";

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
    VerificationIcon,
    OnboardingIcon,
    VolunteerWelcomeModal,
    WebNotificationsButton,
    ArrowIcon
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
      isFirstDashboardVisit: state => state.user.isFirstDashboardVisit
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

    showUpchieve101Notice() {
      if (!this.user.isApproved || !this.user.isOnboarded) return false;
      if (this.user.certifications.upchieve101.passed) return false;
      return new Date(this.user.createdAt) < new Date("9/18/20");
    },

    photoIdAction() {
      switch (this.user.photoIdStatus) {
        case "EMPTY":
          return {
            subtitle: "Upload a photo ID",
            status: "DEFAULT"
          };
        case "SUBMITTED":
          return {
            subtitle: "Pending review",
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
            subtitle: "Upload a photo ID",
            status: "DEFAULT"
          };
      }
    },

    referenceAction() {
      const statuses = this.user.references.map(r => r.status);

      if (statuses.length === 0)
        return {
          subtitle: "Provide 2 references",
          status: "DEFAULT"
        };

      if (statuses.some(s => s === "REJECTED"))
        return {
          subtitle: "Provide new reference(s)",
          status: "ERROR"
        };

      if (statuses.length === 1)
        return {
          subtitle: "In progress: provide 1 additional reference",
          status: "PROGRESS"
        };

      if (statuses[0] === "APPROVED" && statuses[1] === "APPROVED")
        return {
          subtitle: "Completed",
          status: "COMPLETED"
        };

      if (statuses[0] === "SUBMITTED" && statuses[1] === "SUBMITTED")
        return {
          subtitle: "Pending review",
          status: "PENDING"
        };

      return {
        subtitle: "Waiting on references to submit",
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
      for (let cert in this.user.certifications) {
        // skip certification for check for required training
        if (cert === "upchieve101") continue;
        if (this.user.certifications[cert].passed)
          return {
            subtitle: "Completed",
            status: "COMPLETED"
          };
      }
      return {
        subtitle: "Pass at least one quiz",
        status: "DEFAULT"
      };
    },

    trainingAction() {
      const passedQuiz = this.user.certifications.upchieve101.passed;
      if (passedQuiz)
        return {
          subtitle: "Completed",
          status: "COMPLETED"
        };

      const startedCourse = this.user.trainingCourses.upchieve101.progress > 0;
      if (startedCourse)
        return {
          subtitle: "In progress",
          status: "PENDING"
        };

      return {
        subtitle: "Go through our training",
        status: "DEFAULT"
      };
    },

    backgroundInfoAction() {
      if (this.hasCompletedBackgroundInfo)
        return {
          subtitle: "Completed",
          status: "COMPLETED"
        };

      return {
        subtitle: "Fill out form",
        status: "DEFAULT"
      };
    },

    hasCompletedBackgroundInfo() {
      return (
        this.user.occupation &&
        this.user.occupation.length > 0 &&
        this.user.country
      );
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
      const numHoursTutored = Number(this.user.hoursTutored) || "--";

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
    },

    approvalCardSubheader() {
      if (this.user.volunteerPartnerOrg)
        return "Just one step left to get approved to volunteer with UPchieve!";

      return "Complete our screening process to get approved to volunteer with UPchieve.";
    },
    openVolunteerApprovalAccountActions() {
      const accountActions = [
        {
          title: "Background information",
          subtitle: this.backgroundInfoAction.subtitle,
          status: this.backgroundInfoAction.status,
          clickFn: this.goToBackgroundInfo,
          icon: PersonIcon,
          priority: this.addSortPriorityNum(this.backgroundInfoAction.status)
        },
        {
          title: "Proof of identity",
          subtitle: this.photoIdAction.subtitle,
          status: this.photoIdAction.status,
          clickFn: this.togglePhotoUploadModal,
          icon: PersonCardIcon,
          priority: this.addSortPriorityNum(this.photoIdAction.status)
        },
        {
          title: "Reference check",
          subtitle: this.referenceAction.subtitle,
          status: this.referenceAction.status,
          clickFn: this.toggleReferencesModal,
          icon: ReferencesIcon,
          priority: this.addSortPriorityNum(this.referenceAction.status)
        }
      ];

      return accountActions.sort((a, b) => a.priority - b.priority);
    },

    partnerVolunteerApprovalAccountActions() {
      const accountActions = [
        {
          title: "Background information",
          subtitle: this.backgroundInfoAction.subtitle,
          status: this.backgroundInfoAction.status,
          clickFn: this.goToBackgroundInfo,
          icon: PersonIcon,
          priority: this.addSortPriorityNum(this.backgroundInfoAction.status)
        },
        {
          title: "Proof of identity",
          // @todo: change copy for subtitle
          subtitle: "Completed",
          status: "COMPLETED",
          clickFn: () => {},
          icon: PersonCardIcon,
          priority: this.addSortPriorityNum("COMPLETED")
        }
      ];

      return accountActions.sort((a, b) => a.priority - b.priority);
    },

    onboaringAccountActions() {
      const onboaringActions = [
        {
          title: "Complete UPchieve 101",
          subtitle: this.trainingAction.subtitle,
          status: this.trainingAction.status,
          clickFn: this.clickUpchieve101Action,
          icon: TrainingIcon,
          priority: this.addSortPriorityNum(this.trainingAction.status)
        },
        {
          title: "Select availability",
          subtitle: this.availabilityAction.subtitle,
          status: this.availabilityAction.status,
          clickFn: this.clickAvailabilityAction,
          icon: CalendarIcon,
          priority: this.addSortPriorityNum(this.availabilityAction.status)
        },
        {
          title: "Unlock a subject",
          subtitle: this.certificationAction.subtitle,
          status: this.certificationAction.status,
          clickFn: this.clickCertificationAction,
          icon: CertificationIcon,
          priority: this.addSortPriorityNum(this.certificationAction.status)
        }
      ];
      return onboaringActions.sort((a, b) => a.priority - b.priority);
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
    },
    clickUpchieve101Action() {
      this.$router.push("/training/course/upchieve101");
    },
    goToBackgroundInfo() {
      this.$router.push("/background-information");
    },
    addSortPriorityNum(status) {
      if (status === "COMPLETED") return 0;
      if (status === "ERROR") return 1;
      if (status === "PENDING") return 2;
      if (status === "PROGRESS") return 3;
      if (status === "DEFAULT") return 4;
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

.dashboard-notice {
  padding: 15px;
  background: $c-warning-orange;
  border-radius: 8px;
  margin: 20px 0 -20px;
  font-weight: 500;
  font-size: 16px;

  a {
    color: #fff;

    &:hover {
      color: #f3f3f3;
      text-decoration: none;
    }
  }
}

.notifications-button {
  @include flex-container(row, flex-end);
  margin-bottom: 1.4em;
}

.track-hours-link {
  @include font-category("button");
  display: inline-flex;
  align-items: center;
  margin: 0 auto;
  padding: 0;
  color: $c-success-green;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
}

.arrow-icon {
  fill: $c-success-green;
  height: 16px;
  width: 16px;
  margin-top: 2px;
  margin-left: 8px;
}
</style>
