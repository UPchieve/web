<template>
  <div class="pending-volunteers">
    <page-control
      :page="page"
      :isFirstPage="isFirstPage"
      :isLastPage="isLastPage"
      @nextPage="nextPage"
      @previousPage="previousPage"
    />
    <div class="list-wrapper">
      <table>
        <tr>
          <th>Waiting since</th>
          <th>Name</th>
          <th>Email</th>
        </tr>
        <pending-volunteer-list-item
          v-for="volunteer in volunteers"
          :key="volunteer._id"
          :volunteer="volunteer"
        />
      </table>
    </div>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import PendingVolunteerListItem from '@/components/Admin/PendingVolunteerListItem'
import PageControl from '@/components/Admin/PageControl'

const getVolunteersToReview = async page => {
  const {
    body: { volunteers, isLastPage }
  } = await NetworkService.adminGetVolunteersToReview(page)

  return { volunteers, isLastPage }
}

export default {
  name: 'AdminPendingVolunteers',
  components: { PendingVolunteerListItem, PageControl },
  data() {
    return {
      page: 1,
      volunteers: [],
      isLastPage: false
    }
  },
  async created() {
    const page = parseInt(this.$route.query.page) || this.page
    this.setPage(page)
  },
  computed: {
    isFirstPage() {
      return this.page === 1
    }
  },
  methods: {
    async setPage(page) {
      this.page = page
      this.volunteers = []
      this.$router.push({ path: '/admin/volunteers/review', query: { page } })
      const { volunteers, isLastPage } = await getVolunteersToReview(page)
      this.volunteers = volunteers
      this.isLastPage = isLastPage
    },

    nextPage() {
      this.setPage(this.page + 1)
    },

    previousPage() {
      this.setPage(this.page - 1)
    }
  }
}
</script>

<style lang="scss" scoped>
th {
  padding: 20px 40px;
}

.pending-volunteers {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above('medium') {
    margin: 40px;
  }
}
</style>
