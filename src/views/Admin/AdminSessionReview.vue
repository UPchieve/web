<template>
  <div class="admin-sessions">
    <page-control
      :page="page"
      :isFirstPage="isFirstPage"
      :isLastPage="isLastPage"
      @nextPage="nextPage"
      @previousPage="previousPage"
    />
    <sessions-list :sessions="sessions" />
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import SessionsList from '@/components/Admin/SessionsList'
import PageControl from '@/components/Admin/PageControl'

export default {
  name: 'AdminSessionReview',
  components: { SessionsList, PageControl },
  data() {
    return {
      page: 1,
      sessions: [],
      isLastPage: false
    }
  },

  async created() {
    const {
      query: { page: pageQuery }
    } = this.$route
    const page = parseInt(pageQuery) || this.page
    this.setPage(page)
  },

  computed: {
    isFirstPage() {
      return this.page === 1
    }
  },

  methods: {
    setPage(page) {
      this.page = page
      this.sessions = []
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
      const query = {
        page: this.page
      }
      this.$router.push({
        path: '/admin/sessions/review',
        query
      })

      const {
        body: { sessions, isLastPage }
      } = await NetworkService.adminGetSessionsToReview(this.page)
      this.sessions = sessions
      this.isLastPage = isLastPage
    }
  }
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
</style>
