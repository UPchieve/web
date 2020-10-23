<template>
  <div class="admin-sessions">
    <div class="filter-panel">
      <div class="col">
        <div>
          <label for="review-students" class="show-user-type-label"
            >Review Students</label
          >
          <input
            id="review-students"
            type="checkbox"
            v-model="filters.reviewStudent"
            true-value="1"
            false-value=""
          />
          <label for="review-volunteers" class="show-user-type-label"
            >Review Volunteers</label
          >
          <input
            id="review-volunteers"
            type="checkbox"
            v-model="filters.reviewVolunteer"
            true-value="1"
            false-value=""
          />
        </div>
      </div>
    </div>
    <div class="sessions-filter-button">
      <button class="btn" type="button" @click="submitFilters">
        Update
      </button>
    </div>
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

const getSessions = async filters => {
  const {
    body: { sessions, isLastPage }
  } = await NetworkService.adminGetSessionsToReview(filters);

  return { sessions, isLastPage };
};

export default {
  name: "AdminSessionReview",
  components: { SessionsList, PageControl },
  data() {
    return {
      page: 1,
      sessions: [],
      isLastPage: false,
      filters: {
        reviewStudent: "",
        reviewVolunteer: ""
      }
    };
  },

  async created() {
    const {
      query: { page: pageQuery, users }
    } = this.$route;
    const page = parseInt(pageQuery) || this.page;
    if (users === "students") this.filters.reviewStudent = "1";
    if (users === "volunteers") this.filters.reviewVolunteer = "1";

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

    async submitFilters() {
      this.page = 1;
      this.getSessions();
    },

    async getSessions() {
      let users = "";
      if (this.filters.reviewStudent) users = "students";
      if (this.filters.reviewVolunteer) users = "volunteers";
      if (this.filters.reviewStudent && this.filters.reviewVolunteer)
        users = "";
      const query = {
        page: this.page
      };
      if (users) query.users = users;

      this.$router.push({
        path: "/admin/sessions/review",
        query
      });

      const { sessions, isLastPage } = await getSessions({
        page: this.page,
        users
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
  padding: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above("medium") {
    margin: 40px;
    padding: 40px;
  }
}

input[type="number"],
.small-input {
  width: 60px;
}

.filter-panel {
  @include flex-container(row);
  flex-wrap: wrap;

  border-radius: 8px;
  text-align: left;
}
.session-activity-container {
  @include flex-container(row);
}

.col {
  @include flex-container(column);
  flex-basis: 25%;
  margin-bottom: 2.4em;
  margin-right: 1em;
}

.show-user-type-label {
  width: 140px;
}

.min-session-container {
  margin-top: 0.4em;
}

.min-length-label {
  width: 180px;

  &:nth-of-type(2) {
    margin-top: 0.2em;
  }
}

.min-session-length {
  display: inline-block;
  vertical-align: top;
}

.rating-label {
  width: 120px;
}

.sessions-filter-button {
  text-align: left;
  margin: 2em 0;
}

.btn {
  height: 60px;
  background-color: white;
  border: 1px solid $c-border-grey;
  font-size: 16px;
  font-weight: 600;
  color: $c-success-green;
  padding: 0.4em 3em;

  &:hover {
    background-color: $c-success-green;
    color: white;
  }
}

.first-time-label {
  width: 80px;
}
</style>
