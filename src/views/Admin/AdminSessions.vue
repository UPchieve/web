<template>
  <div class="admin-sessions">
    <filter-panel
      :showBannedUsers="filters.showBannedUsers"
      :toggleShowBannedUsers="toggleShowBannedUsers"
      :showTestUsers="filters.showTestUsers"
      :toggleShowTestUsers="toggleShowTestUsers"
      :sessionActivityFrom="filters.sessionActivityFrom"
      :setSessionActivityFrom="setSessionActivityFrom"
      :sessionActivityTo="filters.sessionActivityTo"
      :setSessionActivityTo="setSessionActivityTo"
      :minMessagesSent="filters.minMessagesSent"
      :setMinMessagesSent="setMinMessagesSent"
      :minSessionLength="filters.minSessionLength"
      :setMinSessionLength="setMinSessionLength"
      :submitFilters="submitFilters"
    />
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
import FilterPanel from "@/components/Admin/FilterPanel";
import moment from "moment";

const getSessions = async filters => {
  const {
    body: { sessions, isLastPage }
  } = await NetworkService.adminGetSessions(filters);

  return { sessions, isLastPage };
};

export default {
  name: "AdminSessions",

  components: { SessionsList, PageControl, FilterPanel },

  data() {
    return {
      page: 1,
      sessions: [],
      isLastPage: false,
      filters: {
        showBannedUsers: "",
        showTestUsers: "",
        sessionActivityFrom: moment()
          .startOf("month")
          .format("YYYY-MM-DD"),
        sessionActivityTo: moment().format("YYYY-MM-DD"),
        minMessagesSent: 0,
        minSessionLength: 1 // in minutes,
      }
    };
  },

  async created() {
    const {
      query: {
        page: pageQuery,
        showBannedUsers,
        showTestUsers,
        sessionActivityFrom,
        sessionActivityTo,
        minMessagesSent,
        minSessionLength
      }
    } = this.$route;
    const page = parseInt(pageQuery) || this.page;
    this.filters.showBannedUsers =
      showBannedUsers || this.filters.showBannedUsers;
    this.filters.showTestUsers = showTestUsers || this.filters.showTestUsers;
    this.filters.sessionActivityFrom =
      sessionActivityFrom || this.filters.sessionActivityFrom;
    this.filters.sessionActivityTo =
      sessionActivityTo || this.filters.sessionActivityTo;
    this.filters.minMessagesSent =
      minMessagesSent || this.filters.minMessagesSent;
    this.filters.minSessionLength =
      minSessionLength || this.filters.minSessionLength;
    this.setPage(page);
  },

  computed: {
    isFirstPage() {
      return this.page === 1;
    }
  },

  methods: {
    setPage(page) {
      this.page = page;
      this.sessions = [];
      this.getSessions();
    },

    nextPage() {
      this.setPage(this.page + 1);
    },

    previousPage() {
      this.setPage(this.page - 1);
    },

    toggleShowBannedUsers() {
      this.filters.showBannedUsers = this.filters.showBannedUsers ? "" : "1";
    },

    toggleShowTestUsers() {
      this.filters.showTestUsers = this.filters.showTestUsers ? "" : "1";
    },

    setMinMessagesSent(event) {
      const {
        target: { value }
      } = event;
      this.filters.minMessagesSent = Number(value);
    },

    setMinSessionLength(event) {
      const {
        target: { value }
      } = event;
      this.filters.minSessionLength = Number(value);
    },

    setSessionActivityFrom(event) {
      const {
        target: { value }
      } = event;
      this.filters.sessionActivityFrom = value;
    },

    setSessionActivityTo(event) {
      const {
        target: { value }
      } = event;
      this.filters.sessionActivityTo = value;
    },

    async submitFilters() {
      this.getSessions();
    },

    async getSessions() {
      this.$router.push({
        path: "/admin/sessions",
        query: {
          page: this.page,
          ...this.filters
        }
      });

      const { sessions, isLastPage } = await getSessions({
        page: this.page,
        ...this.filters
      });
      this.sessions = sessions;
      this.isLastPage = isLastPage;
    }
  }
};
</script>

<style lang="scss" scoped>
.admin-sessions {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above("medium") {
    margin: 40px;
  }
}
</style>
