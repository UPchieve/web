<template>
  <div class="admin-sessions">
    <div>
      <label for="studentFirstName">Student First Name</label>
      <input
        id="studentFirstName"
        type="text"
        class="ml-1"
        v-model="studentFirstName"
      />
      <button class="uc-form-button" @click="submitFilters">Filter</button>
    </div>
    <page-control
      :page="page"
      :isFirstPage="isFirstPage"
      :isLastPage="isLastPage"
      @nextPage="nextPage"
      @previousPage="previousPage"
    />
    <loader v-if="isLoading" class="uc-column items-center"></loader>
    <sessions-list v-else :sessions="sessions" />
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import SessionsList from '@/components/Admin/SessionsList.vue'
import PageControl from '@/components/Admin/PageControl.vue'
import Loader from '@/components/Loader.vue'

export default {
  name: 'AdminSessionReview',
  components: { SessionsList, PageControl, Loader },
  data() {
    return {
      page: 1,
      sessions: [],
      isLastPage: false,
      studentFirstName: '',
      isLoading: true,
    }
  },

  async created() {
    const {
      query: { page: pageQuery, studentFirstName },
    } = this.$route
    const page = parseInt(pageQuery) || this.page
    this.studentFirstName = studentFirstName || this.studentFirstName
    this.setPage(page)
  },

  computed: {
    isFirstPage() {
      return this.page === 1
    },
  },

  methods: {
    setPage(page) {
      this.page = page
      this.getSessions()
    },

    nextPage() {
      this.setPage(this.page + 1)
    },

    previousPage() {
      this.setPage(this.page - 1)
    },

    async submitFilters() {
      this.page = 1
      this.getSessions()
    },

    async getSessions() {
      this.isLoading = true
      const query = {
        page: this.page,
        studentFirstName: this.studentFirstName,
      }
      this.$router.push({
        path: '/admin/sessions/review',
        query,
      })
      const {
        data: { sessions, isLastPage },
      } = await NetworkService.adminGetSessionsToReview(
        this.page,
        this.studentFirstName
      )
      this.sessions = sessions
      this.isLastPage = isLastPage
      this.isLoading = false
    },
  },
}
</script>

<style lang="scss" scoped>
.admin-sessions {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above('medium') {
    margin: 40px;
    padding: 40px;
  }
}

.ml-1 {
  margin-left: 0.25rem;
  border: 1px solid $c-secondary-grey;
  padding: 0.4em;
  border-radius: 2px;
}
</style>
