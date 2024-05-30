<template>
  <div class="pr-sidebar">
    <h1 class="pr-sidebar__header">Subjects</h1>
    <v-select
      v-if="isDropdownMode"
      :options="subjectsMapped"
      :modelValue="getSelectedSubjectValue"
      :clearable="false"
      :searchable="false"
      @update:modelValue="handleSubjectChange"
      class="pr-sidebar__dropdown"
    >
      <template #option="subject">
        <div :key="subject.displayName" class="pr-sidebar__dropdown-container">
          <div
            class="pr-sidebar__subject--header pr-sidebar__subject--dropdown-item"
          >
            <img
              class="pr-sidebar__subject--icon"
              :src="subject.topicIconLink"
              :alt="`${subject.displayName} icon`"
            />
            <span class="pr-sidebar__subject--name">{{
              subject.displayName
            }}</span>
          </div>
          <span class="pr-sidebar__subject--grade"
            >{{ subject.overallGrade }}%</span
          >
        </div>
      </template>
    </v-select>

    <template v-else-if="subjectsMapped.length">
      <div
        v-for="subject in subjectsMapped"
        :key="subject.displayName"
        class="pr-sidebar__subject"
        @click="handleSubjectChange(subject)"
      >
        <div class="pr-sidebar__subject--head">
          <img
            class="pr-sidebar__subject--icon"
            :src="subject.topicIconLink"
            :alt="`${subject.displayName} icon`"
          />
          <span class="pr-sidebar__subject--name">{{
            subject.displayName
          }}</span>
        </div>
        <div class="pr-sidebar__subject--tail">
          <activity-dot v-if="subject.totalUnreadReports > 0" />
          <span class="pr-sidebar__subject--grade" v-else
            >{{ subject.overallGrade }}%</span
          >
          <right-caret />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ActivityDot from '@/components/ActivityDot.vue'
import RightCaret from '@/assets/right-caret.svg'
import Case from 'case'

export default {
  name: 'ProgressReportSubjectSidebar',
  components: {
    RightCaret,
    ActivityDot,
  },
  props: {
    subjectsToDisplay: Array,
    isDropdownMode: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selectedSubject: null,
    }
  },
  created() {
    const subject = Case.camel(this.$route.params.subject)
    if (subject) this.selectedSubject = this.getSubject(subject).displayName
  },
  computed: {
    ...mapState({
      subjects: (state) => state.subjects.subjects,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    subjectsMapped() {
      return this.subjectsToDisplay.map((stat) => ({
        ...stat,
        ...this.subjects[stat.subject],
      }))
    },
    getSelectedSubjectValue() {
      return (
        this.selectedSubject ||
        this.getSubject(this.subjectsToDisplay[0].subject)
      )
    },
  },
  methods: {
    getSubject(subject) {
      return this.subjects[subject]
    },
    handleSubjectChange(subject) {
      if (this.mobileMode) this.$store.dispatch('app/sidebar/collapse')
      this.selectedSubject = subject.displayName
      this.$router.replace(`/sessions/progress/${Case.kebab(subject.name)}`)
    },
  },
}
</script>

<style lang="scss" scoped>
.pr-sidebar {
  @include flex-container(column, $align-items: flex-start);
  background-color: $upchieve-white;
  border-radius: 11px;

  &__header {
    font-size: 16px;
    color: $c-soft-black;
    padding-left: 1em;
    font-weight: 400;
    margin: 1em 0;
  }

  &__dropdown {
    width: 100%;
    order: 1;

    &-container {
      @include flex-container(row, space-between, center);
      margin: 0.5em 0;
    }
  }

  &__subject {
    @include flex-container(row, space-between, center);
    width: 100%;
    padding: 1em;
    border-radius: 11px;
    margin-bottom: 1em;

    &:hover {
      background-color: $c-background-blue;
      cursor: pointer;
    }

    &--head {
      @include flex-container(row, initial, center);
    }

    &--tail {
      @include flex-container(row, space-between, center);
      width: 25%;
    }

    &--name {
      margin-left: 0.6em;
      font-weight: 500;
      margin-right: 1em;
    }

    &--icon {
      width: 30px;
    }

    &--grade {
      font-weight: 500;
    }

    &--dropdown-item {
      width: 100%;
      padding: 1em;
      border-radius: 11px;
    }
  }
}
</style>
