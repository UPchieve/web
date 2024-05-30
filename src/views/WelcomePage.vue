<template>
  <div class="welcome-page" v-if="!hasCertification">
    <div class="welcome-page-card">
      <div class="welcome-page-card-content">
        <div class="welcome-page-title-container">
          <h1 class="welcome-page-title">Hi, {{ user.firstname }} 👋</h1>
        </div>
        <div>
          <p class="welcome-page-description">We're so glad you're here!</p>
          <p class="welcome-page-description">
            Let's get certified to tutor! Pass a short quiz in your favorite
            subject.
          </p>
          <p class="welcome-page-description">(Unlimited attempts! 😊)</p>
          <div class="welcome-page-topic-grid">
            <topic-chip
              v-for="(card, index) in topicCards"
              v-bind:key="index"
              :title="card.title"
              :svg="card.svg"
              :totalSubjects="card.subtopics.length"
              class="welcome-page-topic-chip"
              @click="() => handleTopicClick(card.topic)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import TopicChip from '@/components/TopicChip.vue'

export default {
  name: 'welcome-page',
  components: {
    TopicChip,
  },
  async beforeMount() {
    this.$store.dispatch('app/sidebar/hide')
    this.$store.dispatch('app/header/hide')
    if (Object.entries(this.training).length === 0)
      await this.$store.dispatch('subjects/getTrainingSubjects')
  },
  data() {
    return {
      subjectSelection: '',
    }
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
      subjects: (state) => state.subjects.subjects,
      training: (state) => state.subjects.training,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      topicCards: 'subjects/quizTopicCards',
      hasCertification: 'user/hasCertification',
      passedUpchieve101: 'user/passedUpchieve101',
    }),
    inProgress() {
      return (
        this.user.trainingCourses.upchieve101.progress > 0 &&
        !this.completed101Training
      )
    },
    completed101Training() {
      return this.user.trainingCourses.upchieve101.progress === 100
    },
  },

  methods: {
    handleTopicClick(topicName) {
      const topicCard = this.topicCards.find((card) => card.topic === topicName)
      this.$store.dispatch('app/modal/show', {
        component: 'SubjectSelectionModal',
        data: {
          backText: 'Back',
          acceptText: 'Start quiz',
          topic: topicCard.topic,
          title: topicCard.title,
          subtopics: topicCard.subtopics,
          subtopicDisplayNames: topicCard.subtopicDisplayNames,
          svg: topicCard.svg,
          preSelectedSubtopic: topicCard.selectedSubtopic,
          trainingSelect: true,
          subtitle: 'Choose a subject to take a short quiz in.',
        },
      })
    },
    handle101Redirect() {
      this.completed101Training
        ? this.$router.push('/training/upchieve101/quiz')
        : this.$router.push('/training/course/upchieve101')
    },
    handleAvailabilityPageRedirect() {
      this.$router.push('/calendar')
    },
  },
}
</script>

<style lang="scss" scoped>
.welcome-page {
  @include flex-container(column, initial, center);
  background-color: $upchieve-white;
  height: 100%;

  &-card {
    @include flex-container(column, initial, center);
    background-color: $upchieve-white;

    @include breakpoint-above('small') {
      margin-top: 6em;
      width: 80%;
      border-radius: 2em;
    }

    @include breakpoint-above('medium') {
      width: 90%;
    }

    @include breakpoint-above('huge') {
      width: 80%;
    }

    @include breakpoint-above('massive') {
      width: 50%;
    }
  }

  &-card-content {
    margin: 5em 0;
    width: 80%;

    @include breakpoint-above('small') {
      width: 100%;
    }
  }

  &-title-container {
    margin-bottom: 2em;
  }

  &-title {
    @include font-category('display-small');
  }

  &-subtitle {
    @include font-category('body');
    color: $c-secondary-grey;
  }

  &-btn {
    width: 100%;
    margin-top: 1.5em;
  }

  &-topic-grid {
    margin-top: 2em;
    display: grid;
    grid-template-columns: 1fr;
    grid-row-gap: 1ch;
    grid-column-gap: 1.5em;
    justify-content: space-between;

    @include breakpoint-above('small') {
      grid-template-columns: 1fr 1fr;
    }

    @include breakpoint-above('large') {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }

  &-topic-chip {
    width: 100%;
    margin-bottom: 1em;
  }

  &-description {
    margin-bottom: 0;
  }
}
</style>
