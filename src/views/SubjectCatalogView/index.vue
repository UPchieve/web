<template>
  <div class="page-padding">
    <large-button
      class="btn-sign-up"
      primary
      :showArrow="false"
      routeTo="/sign-up/student/eligibility"
      >Sign up</large-button
    >
    <dashboard-banner alternateHeaderText="Welcome to UPchieve!" />
    <div class="flex column w-full h-full">
      <p class="body">
        We are a nonprofit that provides free, online tutoring and college
        counseling 24/7. To get started, select the subject you need help in.
      </p>

      <loader v-if="isLoading" class="flex justify-center w-full h-full" />
      <div v-else-if="!isLoading && hasError" class="red">
        We had trouble loading the list of subjects. Please try refreshing the
        page.
      </div>
      <div v-else class="cards">
        <div
          v-for="(card, index) in cards"
          v-bind:key="index"
          class="SubjectCard"
        >
          <component
            class="SubjectCard-icon"
            v-if="card.isComponentSvg"
            v-bind:is="card.svg"
          />
          <img
            v-else
            :src="card.svg"
            :alt="card.altImageText"
            class="SubjectCard-icon"
          />

          <h2 class="SubjectCard-title">{{ card.title }}</h2>
          <p class="SubjectCard-subtitle">Join a chat room to start.</p>
          <dropdown-list
            v-if="card.subtopics"
            v-model="card.selectedSubtopic"
            class="SubjectCard-dropdown"
            disabledOption="Choose a subject"
            :options="card.subtopics"
            :optionDisplay="card.subtopicDisplayNames"
          />

          <large-button
            primary
            @click.native="handleClick(card)"
            :disabled="!card.selectedSubtopic"
            >Start a chat</large-button
          >
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import AnalyticsService from '@/services/AnalyticsService'
import DashboardBanner from '@/views/DashboardView/DashboardBanner'
import NetworkService from '@/services/NetworkService'
import Loader from '@/components/Loader.vue'
import LargeButton from '@/components/LargeButton.vue'
import DropdownList from '@/components/DropdownList.vue'
import SubjectCatalogSignUpModal from '@/views/SubjectCatalogView/SubjectCatalogSignUpModal'
import { EVENTS } from '@/consts'

export default {
  name: 'subject-catalog-view',
  components: {
    DashboardBanner,
    DropdownList,
    LargeButton,
    Loader,
  },
  data() {
    return {
      isLoading: true,
      hasError: false,
      cards: [],
    }
  },
  async created() {
    this.$store.dispatch('app/hideNavigation')
    this.isLoading = true
    try {
      const res = await NetworkService.getPublicSubjects()
      this.cards = this.createSubjectCards(res.body.subjects)
    } catch (e) {
      this.hasError = true
    } finally {
      this.isLoading = false
    }
  },
  methods: {
    createSubjectCards(subjects) {
      const topics = {}
      for (const subject of Object.values(subjects)) {
        if (!subject.active) continue
        const { topicName } = subject
        if (!topics[topicName]) {
          topics[topicName] = {
            topic: topicName,
            title: subject.topicDisplayName,
            subjects: [],
            subtopics: [],
            subtopicDisplayNames: {},
            svg: subject.topicIconLink,
            order: subject.topicDashboardOrder,
            isTutoringCard: true,
          }
        }
        // Create a list of subjects that a topic has
        topics[topicName].subjects.push({
          name: subject.name,
          id: subject.id,
          displayName: subject.displayName,
          displayOrder: subject.displayOrder,
        })
      }
      // Sort the subjects for each topic and pull out their key
      // along with their display name
      for (const topic of Object.values(topics)) {
        topic.subjects.sort((a, b) => a.displayOrder - b.displayOrder)
        for (const subject of topic.subjects) {
          topic.subtopics.push(subject.name)
          topic.subtopicDisplayNames[subject.name] = subject.displayName
        }
      }
      return Object.values(topics).sort((a, b) => a.order - b.order)
    },
    handleClick(card) {
      AnalyticsService.captureEvent(EVENTS.FLAGGED_AS_DASHBOARD_FIRST, {
        subject: card.subject,
        topic: card.selectedSubtopic,
      })
      this.$store.dispatch('app/modal/show', {
        component: SubjectCatalogSignUpModal,
        data: {
          showTemplateButtons: false,
        },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.w-full {
  width: 100%;
}

.h-full {
  height: 100%;
}

.flex {
  display: flex;
}

.column {
  flex-direction: column;
}

.row {
  flex-direction: row;
}

.justify-center {
  justify-content: center;
}

.red {
  color: $c-error-red;
}

.body {
  @include font-category('display-small');
  margin: 30px 16px;
  text-align: center;
}

.btn-sign-up {
  float: right;
  margin: 16px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 40px;
}

.SubjectCard {
  @include flex-container(column, space-between, center);
  @include child-spacing(left, 0);
  @include child-spacing(top, 32px);
  padding: 32px;
  padding-top: 24px;
  background: white;
  border-radius: 8px;
  padding: 16px;
}

.SubjectCard-icon {
  width: 80px;
  height: 80px;
}

.SubjectCard-title {
  @include font-category('heading');
  margin-top: 8px;
  padding: 0;
}

.SubjectCard-subtitle {
  @include font-category('body');
  color: $c-secondary-grey;
  margin-top: 8px;
  padding: 0;
}

.SubjectCard-dropdown {
  margin: 0;
  min-width: 260px;
}

.error {
  color: $c-error-red;
}

.page-padding {
  padding: 0 40px 40px 40px;
}
</style>
