<template>
  <div class="student-assignments">
    <div class="student-assignments--header">
      <h1>Your Assignments</h1>
      <button type="button" @click="goToClasses">See all</button>
    </div>
    <div class="student-assignments--assignments">
      <div
        v-for="assignment in filterStudentAssignments"
        v-bind:key="assignment.id"
      >
        <button
          type="button"
          class="assignment-card"
          @click="goToAssignment(assignment.classId, assignment.id)"
        >
          <div class="assignment-card--header">
            <div class="assignment-card--icon">
              <AssignmentIcon />
            </div>
            <div class="assignment-card--header-text">
              <h2>{{ assignment.title }}</h2>
              <p>Due Date: {{ formatDate(assignment.dueDate) }}</p>
            </div>
          </div>
          <p class="assignments-progress-text">
            {{ assignment.completedSessions.length }} /
            {{ assignment.numberOfSessions }} sessions completed
          </p>
          <div class="progress-bar-container">
            <div
              class="progress-bar"
              :style="{
                width:
                  (assignment.completedSessions.length /
                    assignment.numberOfSessions) *
                    100 +
                  '%',
              }"
            ></div>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import { dayjs } from '@/utils/time-utils'
import AssignmentIcon from '@/assets/AssignmentIcon.svg'
import { getIncompleteAssignments } from '@/utils/student-assignments-utils'

export default {
  name: 'StudentAssignments',

  components: {
    AssignmentIcon,
  },

  props: {
    assignments: {
      type: Array,
      required: true,
    },
  },

  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    filterStudentAssignments() {
      return getIncompleteAssignments(this.assignments).slice(0, 3)
    },
  },

  methods: {
    formatDate(date) {
      if (date) {
        return dayjs(date).format('MM/DD/YYYY')
      }
      return 'None'
    },

    goToClasses() {
      this.$router.push('/classes')
    },

    goToAssignment(classId, assignmentId) {
      this.$router.push(`/classes/${classId}/assignments/${assignmentId}`)
    },
  },
}
</script>

<style lang="scss" scoped>
.student-assignments {
  border: 1px $c-border-grey solid;
  background-color: #fff;
  padding: 16px;
  border-radius: 8px;

  &--assignments {
    gap: 16px;
    @include breakpoint-above('small') {
      @include flex-container(column, initial, center);
      flex-flow: wrap;
      gap: 8px;
    }

    @include breakpoint-between('760px', '992px') {
      @include flex-container(row, flex-start, flex-start);
      gap: 8px;
    }

    @include breakpoint-above('large') {
      @include flex-container(row, flex-start, flex-start);
      flex-flow: wrap;
    }
  }

  &--header {
    @include flex-container(row, space-between, center);
    padding: 8px;
  }

  h1 {
    font-size: 18px;
  }
}

.assignment-card {
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  padding: 12px;

  @include breakpoint-above('small') {
    width: 45%;
  }

  @include breakpoint-between('760px', '992px') {
    width: 100%;
  }

  @include breakpoint-above('large') {
    width: 330px;
  }

  &--header {
    @include flex-container(row, flex-start, flex-start);
    gap: 16px;
  }

  &--header-text {
    text-align: left;
    white-space: nowrap;
    overflow: hidden;

    h2 {
      font-size: 18px;
      margin-bottom: 0;
      text-overflow: ellipsis;
      overflow: hidden;
    }
  }

  .assignments-progress-text {
    margin-bottom: 8px;
    font-size: 14px;
    text-align: right;
  }
  .progress-bar-container {
    width: 100%;
    height: 10px;
    border-radius: 12px;
    background-color: $selected-green;
  }

  .progress-bar {
    height: 100%;
    background-color: $upchieve-green;
    width: 0%;
  }
}
</style>
