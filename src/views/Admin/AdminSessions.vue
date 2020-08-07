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
      :studentRating="filters.studentRating"
      :setStudentRating="setStudentRating"
      :volunteerRating="filters.volunteerRating"
      :setVolunteerRating="setVolunteerRating"
      :submitFilters="submitFilters"
      :firstTimeStudent="filters.firstTimeStudent"
      :toggleFirstTimeStudent="toggleFirstTimeStudent"
      :firstTimeVolunteer="filters.firstTimeVolunteer"
      :toggleFirstTimeVolunteer="toggleFirstTimeVolunteer"
      :isReported="filters.isReported"
      :toggleIsReported="toggleIsReported"
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
          .subtract(7, "days")
          .format("YYYY-MM-DD"),
        sessionActivityTo: moment().format("YYYY-MM-DD"),
        minMessagesSent: 0,
        minSessionLength: 1, // in minutes,
        studentRating: "",
        volunteerRating: "",
        firstTimeStudent: "",
        firstTimeVolunteer: "",
        isReported: ""
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
        minSessionLength,
        studentRating,
        volunteerRating,
        firstTimeStudent,
        firstTimeVolunteer,
        isReported
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
      parseInt(minMessagesSent) || this.filters.minMessagesSent;
    this.filters.minSessionLength =
      parseInt(minSessionLength) || this.filters.minSessionLength;
    this.filters.studentRating = studentRating || this.filters.studentRating;
    this.filters.volunteerRating =
      volunteerRating || this.filters.volunteerRating;
    this.filters.firstTimeStudent =
      firstTimeStudent || this.filters.firstTimeStudent;
    this.filters.firstTimeVolunteer =
      firstTimeVolunteer || this.filters.firstTimeVolunteer;
    this.filters.isReported = isReported || this.filters.isReported;
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

    setStudentRating(event) {
      const {
        target: { value }
      } = event;
      this.filters.studentRating = value;
    },

    setVolunteerRating(event) {
      const {
        target: { value }
      } = event;
      this.filters.volunteerRating = value;
    },

    toggleFirstTimeStudent() {
      this.filters.firstTimeStudent = this.filters.firstTimeStudent ? "" : "1";
    },

    toggleFirstTimeVolunteer() {
      this.filters.firstTimeVolunteer = this.filters.firstTimeVolunteer
        ? ""
        : "1";
    },

    toggleIsReported() {
      this.filters.isReported = this.filters.isReported ? "" : "1";
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
