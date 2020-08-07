<template>
  <div class="admin-sessions">
    <div class="filter-panel">
      <div class="col">
        <div>
          <label for="show-banned-users" class="show-user-type-label"
            >Show banned users</label
          >
          <input
            id="show-banned-users"
            type="checkbox"
            v-model="filters.showBannedUsers"
            true-value="1"
            false-value=""
          />
        </div>
        <div>
          <label for="show-test-users" class="show-user-type-label"
            >Show test users</label
          >
          <input
            id="show-test-users"
            type="checkbox"
            v-model="filters.showTestUsers"
            true-value="1"
            false-value=""
          />
        </div>
      </div>

      <div class="col">
        <div>
          <label for="min-messages-sent" class="min-length-label"
            >Minimum messages sent</label
          >
          <input
            id="min-messages-sent"
            type="number"
            v-model.number="filters.minMessagesSent"
          />
        </div>

        <div class="min-session-container">
          <label for="min-session-length" class="min-length-label"
            >Minimum session length (in mins)</label
          >
          <input
            id="min-session-length"
            class="min-session-length"
            type="number"
            v-model.number="filters.minSessionLength"
          />
        </div>
      </div>

      <div class="col">
        <div class="session-activity-container">
          <label for="session-activity-from" class="col"
            >from
            <input
              id="session-activity-from"
              type="date"
              v-model="filters.sessionActivityFrom"
            />
          </label>

          <label for="session-activity-to" class="col"
            >to
            <input
              id="session-activity-to"
              type="date"
              v-model="filters.sessionActivityTo"
            />
          </label>
        </div>
      </div>

      <div class="col">
        <div>
          <label for="student-rating" class="rating-label"
            >Student rating</label
          >
          <input
            id="student-rating"
            class="rating-input small-input"
            type="text"
            v-model="filters.studentRating"
          />
        </div>

        <div class="min-session-container">
          <label for="volunteer-rating" class="rating-label"
            >Volunteer rating</label
          >
          <input
            id="volunteer-rating"
            class="rating-input small-input"
            type="text"
            v-model="filters.volunteerRating"
          />
        </div>
      </div>

      <div class="col">
        <label class="show-user-type-label">First time:</label>
        <div>
          <label
            class="uc-form-label first-time-label"
            for="first-time-student"
          >
            Student
          </label>
          <input
            id="first-time-student"
            type="checkbox"
            v-model="filters.firstTimeStudent"
            true-value="1"
            false-value=""
          />
        </div>
        <div>
          <label
            class="uc-form-label first-time-label"
            for="first-time-volunteer"
          >
            Volunteer
          </label>
          <input
            id="first-time-volunteer"
            type="checkbox"
            v-model="filters.firstTimeVolunteer"
            true-value="1"
            false-value=""
          />
        </div>
      </div>

      <div class="col">
        <label for="reported">Reported</label>
        <input
          id="reported"
          type="checkbox"
          v-model="filters.isReported"
          true-value="1"
          false-value=""
        />
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
import moment from "moment";

const getSessions = async filters => {
  const {
    body: { sessions, isLastPage }
  } = await NetworkService.adminGetSessions(filters);

  return { sessions, isLastPage };
};

export default {
  name: "AdminSessions",

  components: { SessionsList, PageControl },

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

    async submitFilters() {
      this.page = 1;
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
