<template>
  <div class="teacher-dashboard">
    <dashboard-banner />
    <div class="main">
      <!-- TODO: Add error message on error. -->
      <loader v-if="isLoading" />
      <div v-else-if="!classes.length" class="uc-column center center">
        You don't have any classes yet!
        <button class="uc-form-button" @click="openCreateTeacherClassModal">
          Add a class now
        </button>
      </div>
      <div v-else-if="classes.length">
        <button class="uc-form-button" @click="openCreateTeacherClassModal">
          Add class
        </button>
        <table>
          <thead>
            <tr>
              <th>Class</th>
              <th>Code</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="teacherClass in classes" :key="teacherClass">
              <th>{{ teacherClass.name }}</th>
              <th>{{ teacherClass.code }}</th>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import DashboardBanner from '../DashboardBanner.vue'
import Loader from '@/components/Loader.vue'
import NetworkService from '@/services/NetworkService'

export default {
  name: 'teacher-dashboard',
  components: {
    DashboardBanner,
    Loader,
  },

  data() {
    return {
      classes: [],
      error: '',
      isLoading: true,
    }
  },

  async created() {
    await this.getTeacherClasses()
  },

  methods: {
    async getTeacherClasses() {
      this.isLoading = true
      try {
        const {
          data: { teacherClasses },
        } = await NetworkService.getTeacherClasses()
        // TODO: Filter by active vs. not active; Have a tab to switch between the two.
        this.classes = teacherClasses.filter((c) => c.active)
      } catch (err) {
        this.error =
          err.response.data.err ??
          'Unable to load your classes. Please refresh the page and try again.'
      } finally {
        this.isLoading = false
      }
    },

    async createTeacherClass(className) {
      this.isLoading = true
      try {
        const {
          data: { teacherClass },
        } = await NetworkService.createTeacherClass(className)
        this.classes.push(teacherClass)
      } catch (err) {
        this.error = err.response.data.err ?? 'Unable to create class.'
      } finally {
        this.isLoading = false
      }
    },

    openCreateTeacherClassModal() {
      this.$store.dispatch('app/modal/show', {
        component: 'CreateTeacherClassModal',
        data: {
          createTeacherClass: this.createTeacherClass,
        },
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.teacher-dashboard {
  padding: 40px 15px;
}

.main {
  @include flex-container(column, center, center);

  margin-top: 40px;
}
</style>
