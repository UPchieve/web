<template>
  <div class="admin-users">
    <div class="search-panel">
      <div class="col">
        <div class="row">
          <label for="first-name" class="uc-form-label">First name</label>
          <input id="first-name" type="text" v-model="firstName" />
        </div>
        <div class="row">
          <label for="last-name" class="uc-form-label">Last name</label>
          <input id="last-name" type="text" v-model="lastName" />
        </div>
        <div class="row">
          <label for="email" class="uc-form-label">Email</label>
          <input id="email" type="text" v-model="email" />
        </div>
      </div>

      <div>
        <button class="uc-form-button" type="button" @click="getUsers">
          Search
        </button>
      </div>
    </div>
    <page-control
      :page="page"
      :isFirstPage="isFirstPage"
      :isLastPage="isLastPage"
      @nextPage="nextPage"
      @previousPage="previousPage"
    />
    <div class="list-wrapper">
      <div class="list">
        <user-list-item v-for="user in users" :key="user._id" :user="user" />
      </div>
    </div>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import PageControl from "@/components/Admin/PageControl";
import UserListItem from "@/components/Admin/UserListItem";

const getUsers = async data => {
  const {
    body: { users, isLastPage }
  } = await NetworkService.adminGetUsers(data);

  return { users, isLastPage };
};

export default {
  name: "AdminUsers",

  components: { UserListItem, PageControl },

  data() {
    return {
      page: 1,
      isLastPage: true,
      users: [],
      firstName: "",
      lastName: "",
      email: ""
    };
  },

  async created() {
    const {
      query: { page: pageQuery, firstName, lastName, email }
    } = this.$route;
    const page = parseInt(pageQuery);
    this.page = page || this.page;
    this.firstName = firstName || this.firstName;
    this.lastName = lastName || this.lastName;
    this.email = email || this.email;

    this.$nextTick(() => {
      document
        .querySelector(".search-panel")
        .addEventListener("keydown", this.keyboardListener);
    });
  },

  computed: {
    isFirstPage() {
      return this.page === 1;
    }
  },

  methods: {
    setPage(page) {
      this.page = page;
      this.users = [];
      this.getUsers();
    },

    nextPage() {
      this.setPage(this.page + 1);
    },

    previousPage() {
      this.setPage(this.page - 1);
    },

    async getUsers() {
      const data = {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email
      };
      this.$router.push({
        path: "/admin/users",
        query: {
          ...data,
          page: this.page
        }
      });
      const { users, isLastPage } = await getUsers({
        ...data,
        page: this.page
      });
      this.users = users;
      this.isLastPage = isLastPage;
    },
    keyboardListener(event) {
      const { key, target } = event;
      const { tagName } = target;
      if (key === "Enter" && tagName === "INPUT") {
        this.getUsers();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.admin-users {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above("medium") {
    margin: 40px;
  }
}

.search-panel {
  text-align: left;

  @include breakpoint-above("medium") {
    margin: 40px;
  }
}

.row {
  margin-bottom: 1em;
}

.list-wrapper {
  overflow-x: scroll;
}
.list {
  min-width: 750px;
  max-width: 1200px;
}

.uc-form-label {
  width: 100px;
  text-align: left;
}

.uc-form-button {
  margin-top: 1em;
  padding: 1em 1.6em;
  border: 1px solid $c-border-grey;
}
</style>
