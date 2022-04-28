<template>
  <div class="admin-ineligible-students">
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
          <th>Created At</th>
          <th>Email</th>
          <th>Median income</th>
          <th>Zip code</th>
          <th>School</th>
          <th>School approval status</th>
        </tr>
        <ineligible-student-list-item
          v-for="student in ineligibleStudents"
          :key="student._id"
          :student="student"
        />
      </table>
    </div>
  </div>
</template>

<script>
import NetworkService from '@/services/NetworkService'
import IneligibleStudentListItem from '@/components/Admin/IneligibleStudentListItem'
import PageControl from '@/components/Admin/PageControl'

const getIneligibleStudents = async page => {
  const {
    body: { ineligibleStudents, isLastPage }
  } = await NetworkService.adminGetIneligibleStudents(page)
  return { ineligibleStudents, isLastPage }
}

export default {
  name: 'AdminIneligibleStudents',
  components: { PageControl, IneligibleStudentListItem },

  data() {
    return {
      page: 1,
      ineligibleStudents: [],
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
      this.$router.push({
        path: '/admin/ineligible-students',
        query: { page }
      })
      const { ineligibleStudents, isLastPage } = await getIneligibleStudents(
        page
      )
      this.ineligibleStudents = ineligibleStudents
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
table {
  min-width: 750px;
  max-width: 1200px;
  overflow-x: scroll;
}

th {
  padding: 20px 40px;
}

.list-wrapper {
  overflow-x: scroll;
}

.admin-ineligible-students {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above('medium') {
    margin: 40px;
  }
}
</style>
