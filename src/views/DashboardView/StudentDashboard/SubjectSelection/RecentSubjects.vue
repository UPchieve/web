<template>
  <div>
    <h2 class="recent-subjects-title">Your recent subjects</h2>
    <div class="recent-subjects-cards">
      <recent-subject-card
        v-for="subject in user.latestRequestedSubjects"
        @subject-clicked="togglePresessionSurvey"
        :key="subject"
        :subject="subjects[subject]"
        :disabled="disabled"
        class="recent-subjects-cards__card"
      />
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import RecentSubjectCard from './RecentSubjectCard.vue'

export default {
  name: 'recent-subjects',
  components: { RecentSubjectCard },
  props: {
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    ...mapState({
      subjects: (state) => state.subjects.subjects,
      user: (state) => state.user.user,
    }),
  },
  methods: {
    togglePresessionSurvey(subject) {
      this.$store.dispatch('app/modal/show', {
        component: 'SubjectSelectionModal',
        data: {
          topic: subject.topicName,
          title: subject.displayName,
          svg: subject.topicIconLink,
          preSelectedSubtopic: subject.name,
        },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.recent-subjects {
  &-title {
    font-size: 18px;
  }

  &-cards {
    @include flex-container(column);

    @include breakpoint-above('small') {
      @include flex-container(row, initial, center);
      flex-flow: wrap;
    }

    @include breakpoint-between('760px', '992px') {
      @include flex-container(column);
    }

    @include breakpoint-above('large') {
      @include flex-container(row, initial, center);
      flex-flow: wrap;
    }

    &__card {
      margin-bottom: 1em;

      @include breakpoint-above('small') {
        width: 45%;
        margin-right: 1em;
      }

      @include breakpoint-between('760px', '992px') {
        width: 70%;
      }

      @include breakpoint-above('large') {
        width: 250px;
        margin-right: 1em;
      }
    }
  }
}
</style>
