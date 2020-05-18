<template>
  <div class="SubjectSelection">
    <p v-if="hasWaitingPeriod" class="waiting-period">
      {{ waitingPeriodMessage }}
    </p>
    <h2 v-if="mobileMode">
      Explore our subjects
    </h2>
    <subject-card
      v-for="(card, index) in cards"
      v-bind:key="index"
      :title="card.title"
      :subtitle="card.subtitle"
      :svg="card.svg"
      :topic="card.topic"
      :subtopics="card.subtopics"
      :subtopicDisplayNames="card.subtopicDisplayNames"
      :button-text="card.buttonText"
      :routeTo="card.routeTo"
      :disableSubjectCard="isCardDisabled(card)"
    />
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import SubjectCard from "./SubjectCard";
import MathSVG from "@/assets/subject_icons/math.svg";
import CollegeSVG from "@/assets/subject_icons/college-counseling.svg";
import ScienceSVG from "@/assets/subject_icons/science.svg";
import calculateWaitingPeriodCountdown from "@/utils/calculate-waiting-period-countdown";
import ReferralSVG from "@/assets/dashboard_icons/student/referral.svg";
import LightBulbSVG from "@/assets/dashboard_icons/student/light-bulb.svg";

import { topics } from "@/utils/topics";

export default {
  name: "subject-selection",
  components: { SubjectCard },
  beforeDestroy() {
    clearTimeout(this.waitingPeriodTimeoutId);
  },
  data() {
    const svgs = {
      math: MathSVG,
      college: CollegeSVG,
      science: ScienceSVG
    };

    const cards = Object.entries(topics).map(([key, topicObj]) => {
      return {
        title: topicObj.displayName,
        svg: svgs[key],
        topic: key,
        subtopics: Object.keys(topicObj.subtopics).sort(),
        subtopicDisplayNames: Object.entries(topicObj.subtopics)
          .map(([subtopicKey, subtopicObj]) => [
            subtopicKey,
            subtopicObj.displayName
          ])
          .reduce((result, [subtopicKey, displayName]) => {
            result[subtopicKey] = displayName;
            return result;
          }, {}),
        isTutoringCard: true
      };
    });

    cards.push({
      title: "Invite Your Friends",
      subtitle: "Share UPchieve with a friend and you could win up to $100!",
      svg: ReferralSVG,
      buttonText: "Learn More"
    });

    cards.push({
      title: "Feedback",
      subtitle:
        "Help us improve by telling us what new subjects and features you want!",
      svg: LightBulbSVG,
      buttonText: "Give feedback",
      routeTo: "/contact"
    });

    return {
      cards,
      disableSubjectCard: false,
      waitingPeriodTimeoutId: null,
      hasWaitingPeriod: false,
      waitingPeriodTimeLeft: 0
    };
  },
  computed: {
    ...mapState({
      latestSession: state => state.user.latestSession
    }),
    ...mapGetters({
      mobileMode: "app/mobileMode",
      isSessionAlive: "user/isSessionAlive"
    }),
    waitingPeriodMessage() {
      const countdown = calculateWaitingPeriodCountdown(
        this.waitingPeriodTimeLeft
      );
      const minuteTextFormat = countdown === 1 ? "minute" : "minutes";

      return `You must wait at least ${countdown} ${minuteTextFormat} before requesting a new session.`;
    }
  },
  watch: {
    // This component mounts before the lastestSession and isSessionAlive
    // have a value in the store - watch for updates
    latestSession() {
      this.checkOrEnforceWaitingPeriod();
    },
    isSessionAlive() {
      this.checkOrEnforceWaitingPeriod();
    }
  },
  methods: {
    calculateTimeSinceLastSession() {
      const sessionCreatedAtInMS = new Date(
        this.latestSession.createdAt
      ).getTime();
      const currentDateInMS = new Date().getTime();
      return currentDateInMS - sessionCreatedAtInMS;
    },
    checkOrEnforceWaitingPeriod() {
      const timeSinceLastSession = this.calculateTimeSinceLastSession();
      const fiveMinutes = 1000 * 60 * 5;
      const timeLeftUntilFiveMinutes = fiveMinutes - timeSinceLastSession;

      // Only show a waiting period message if there's no active session
      // and the latest session's created at has been within a timeframe of 5 minutes.
      // Sets a timeout to remove the waiting period message
      if (timeSinceLastSession < fiveMinutes && !this.isSessionAlive) {
        // Show the waiting period message as a header if not in mobile mode
        if (!this.mobileMode) {
          this.disableSubjectCard = true;
          const headerData = {
            component: "WaitingPeriodHeader",
            data: {
              important: true,
              timeLeft: timeLeftUntilFiveMinutes
            }
          };
          this.$store.dispatch("app/header/show", headerData);

          this.waitingPeriodTimeoutId = setTimeout(() => {
            this.disableSubjectCard = false;
            this.$store.dispatch("app/header/hide");
          }, timeLeftUntilFiveMinutes);
        } else {
          // Show the waiting period message above the subject cards for mobile users
          this.hasWaitingPeriod = true;
          this.disableSubjectCard = true;
          this.waitingPeriodTimeLeft = timeLeftUntilFiveMinutes;

          this.waitingPeriodTimeoutId = setTimeout(() => {
            this.hasWaitingPeriod = false;
            this.disableSubjectCard = false;
          }, timeLeftUntilFiveMinutes);
        }
      } else {
        this.hasWaitingPeriod = false;
      }
    },
    isCardDisabled(card) {
      return (
        card.isTutoringCard && (this.disableSubjectCard || this.isSessionAlive)
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.SubjectSelection {
  @include flex-container(column);
  @include child-spacing(top, 16px);

  h2 {
    @include font-category("heading");
    margin: 0;
    padding: 0;
    text-align: left;
  }

  @include breakpoint-above("medium") {
    @include child-spacing(top, 0);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
    gap: 40px;
  }
}

.waiting-period {
  @include font-category("body");
  color: white;
  margin-bottom: 40px;
  background: $c-warning-orange;
  padding: 1em;
  border-radius: 8px;
  text-align: center;

  @include breakpoint-above("medium") {
    margin-bottom: initial;
  }

  // @note - temporary fix for if the mobile waiting period
  //         message happens to render on a large screen
  @include breakpoint-above("large") {
    @include flex-container(row, center, center);
    @include font-category("heading");
    margin-top: initial;
  }
}
</style>
