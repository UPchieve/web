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
import NetworkService from "@/services/NetworkService";
import SessionsList from "@/components/Admin/SessionsList";
import PageControl from "@/components/Admin/PageControl";

const getSessions = async page => {
  const {
    body: { sessions, isLastPage }
  } = await NetworkService.adminGetSessions(page);

  return { sessions, isLastPage };
};

export default {
  name: "AdminSessions",

  components: { SessionsList, PageControl },

  data() {
    return {
      page: 1,
      sessions: [],
      isLastPage: false
    };
  },

  async created() {
    const page = parseInt(this.$route.query.page) || this.page;
    this.setPage(page);
  },

  computed: {
    isFirstPage() {
      return this.page === 1;
    }
  },

  methods: {
    async setPage(page) {
      this.page = page;
      this.sessions = [];
      this.$router.push({ path: "/admin/sessions", query: { page } });
      const { sessions, isLastPage } = await getSessions(page);
      this.sessions = sessions;
      this.isLastPage = isLastPage;
    },

    nextPage() {
      this.setPage(this.page + 1);
    },

    previousPage() {
      this.setPage(this.page - 1);
    }
  }
};
</script>

<style lang="scss" scoped>
.admin-sessions {
  background: #fff;
  margin: 10px;
  border-radius: 8px;

  @include breakpoint-above("medium") {
    margin: 40px;
  }
}
</style>
