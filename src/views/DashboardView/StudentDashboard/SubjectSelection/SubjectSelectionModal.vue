<template>
  <div class="SubjectSelectionModal">
    <component v-if="!mobileMode" :is="modalData.svg" class="icon" />
    <h1 class="SubjectSelectionModal-title">{{ title }}</h1>
    <h2 v-if="!mobileMode" class="SubjectSelectionModal-subtitle">
      Choose a subject so we can connect you with the right tutor.
    </h2>

    <div class="SubjectSelectionModal-subtopics">
      <div
        v-for="(subtopic, index) in modalData.subtopics"
        v-bind:key="index"
        class="SubjectSelectionModal-subtopic"
        :class="{
          'SubjectSelectionModal-subtopic--selected':
            subtopic === selectedSubtopic
        }"
        @click="setSelectedSubtopic(subtopic)"
      >
        <p class="SubjectSelectionModal-subtopic-title">
          {{ modalData.subtopicDisplayNames[subtopic] || subtopic }}
        </p>
        <large-button
          v-if="mobileMode"
          primary
          @click.native="handleMobileStart(subtopic)"
          >{{ modalData.acceptText }}</large-button
        >
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import { startSession } from "@/utils/session";
import LargeButton from "@/components/LargeButton";

export default {
  components: { LargeButton },
  props: {
    modalData: { type: Object, required: true }
  },
  data() {
    return {
      selectedSubtopic: ""
    };
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp,
      hasPushToken: state => state.user.hasPushToken,
      user: state => state.user.user
    }),
    ...mapGetters({ mobileMode: "app/mobileMode" }),
    title() {
      return this.modalData.topic
        ? `Choose a ${this.modalData.topic} subject`
        : "Choose a subject";
    }
  },
  methods: {
    setSelectedSubtopic(subject) {
      this.selectedSubtopic = subject;
      this.$emit("enable-accept", subject !== "");
    },
    handleMobileStart(subject) {
      this.setSelectedSubtopic(subject);

      // Show notification modal if past sessions is a multiple of 3
      const showNotificationModal = this.user.numPastSessions % 3 === 0;

      if (this.isMobileApp && !this.hasPushToken && showNotificationModal) {
        this.$store.dispatch("app/modal/show", {
          component: "NotificationsModal",
          data: {
            backText: "Dashboard",
            acceptText: "Yes, please notify me!",
            selectedSubtopic: this.selectedSubtopic,
            topic: this.modalData.topic
          }
        });
      } else {
        this.onAccept();
      }
    },
    onAccept() {
      if (this.selectedSubtopic === "") return;
      startSession(this.$router, this.modalData.topic, this.selectedSubtopic);
    }
  }
};
</script>

<style lang="scss" scoped>
h1,
h2,
p {
  margin: 0;
  padding: 0;
}

.icon {
  align-self: center;
}

.SubjectSelectionModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above("medium") {
    @include child-spacing(top, 16px);
  }
}

.SubjectSelectionModal-title {
  @include font-category("display-small");
  @include breakpoint-above("medium") {
    margin-top: 24px;
  }
}

.SubjectSelectionModal-subtitle {
  @include font-category("body");
  color: $c-secondary-grey;
}

.SubjectSelectionModal-subtopics {
  @include flex-container(column);
  @include child-spacing(top, 16px);

  @include breakpoint-above("medium") {
    @include child-spacing(top, 0);

    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto;
    grid-gap: 24px;

    margin: 40px 0;
  }
}

.SubjectSelectionModal-subtopic {
  @include flex-container(row, space-between, center);
  @include child-spacing(left, 16px);
  @include font-category("button");

  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 20px 24px;

  @include breakpoint-below("tiny") {
    @include flex-container(column, center, center);
    @include child-spacing(left, 0);
    @include child-spacing(top, 16px);
  }

  @include breakpoint-above("medium") {
    color: $c-secondary-grey;
    cursor: pointer;
    border-radius: 4px;
    justify-content: center;
    padding: 10px;

    &--selected {
      border-color: $c-success-green;
      color: $c-success-green;
    }
  }
}
</style>
