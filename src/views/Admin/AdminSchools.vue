<template>
  <div class="schools">
    <router-link to="/admin/school/new" class="schools__add-school--link">
      <plus-icon class="plus-icon" />
      <span>Add a school</span>
    </router-link>
    <div class="schools__search-panel">
      <div class="schools__input-row">
        <label for="name" class="uc-form-label">School name</label>
        <input id="name" type="text" v-model="name" />
      </div>

      <div class="schools__input-row">
        <label for="city" class="uc-form-label">School city</label>
        <input id="city" type="text" v-model="city" />
      </div>

      <div class="schools__input-row">
        <label class="uc-form-label">School state</label>
        <v-select
          class="schools__v-select--state"
          id="state"
          v-model="state"
          :options="states"
          label="label"
          :searchable="true"
          :reduce="option => option.value"
        />
      </div>

      <div>
        <button class="uc-form-button" type="button" @click="submitQuery">
          Search
        </button>
      </div>
    </div>
    <template v-if="schools.length > 0">
      <div class="list-wrapper">
        <div class="list">
          <page-control
            :page="page"
            :isFirstPage="isFirstPage"
            :isLastPage="isLastPage"
            @nextPage="nextPage"
            @previousPage="previousPage"
          />
          <school-list-item
            v-for="school in schools"
            :key="school._id"
            :school="school"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import PageControl from "@/components/Admin/PageControl";
import SchoolListItem from "@/components/Admin/SchoolListItem";
import PlusIcon from "@/assets/plus_icon.svg";
import { STATES_WITH_ABBREVIATIONS } from "@/consts";

const getSchools = async data => {
  const {
    body: { schools, isLastPage }
  } = await NetworkService.adminGetSchools(data);
  return { schools, isLastPage };
};

export default {
  name: "AdminSchools",
  components: { SchoolListItem, PageControl, PlusIcon },
  data() {
    return {
      page: 1,
      isLastPage: true,
      schools: [],
      name: "",
      city: "",
      state: ""
    };
  },
  async created() {
    const {
      query: { page: pageQuery, name, city, state }
    } = this.$route;
    const page = parseInt(pageQuery) || this.page;
    this.name = name || this.name;
    this.city = city || this.city;
    this.state = state || this.state;
    this.$nextTick(() => {
      document
        .querySelector(".schools__search-panel")
        .addEventListener("keydown", this.keyboardListener);
    });

    this.setPage(page);
  },
  computed: {
    isFirstPage() {
      return this.page === 1;
    },
    states() {
      return STATES_WITH_ABBREVIATIONS;
    }
  },
  methods: {
    setPage(page) {
      this.page = page;
      this.schools = [];
      this.getSchools();
    },
    nextPage() {
      this.setPage(this.page + 1);
    },
    previousPage() {
      this.setPage(this.page - 1);
    },
    submitQuery() {
      this.page = 1;
      this.getSchools();
    },
    async getSchools() {
      const data = {
        name: this.name,
        city: this.city,
        state: this.state ? this.state : ""
      };
      this.$router.push({
        path: "/admin/schools",
        query: {
          ...data,
          page: this.page
        }
      });
      const { schools, isLastPage } = await getSchools({
        ...data,
        page: this.page
      });
      this.schools = schools;
      this.isLastPage = isLastPage;
    },
    keyboardListener(event) {
      const { key, target } = event;
      const { tagName } = target;
      if (key === "Enter" && tagName === "INPUT") {
        this.getSchools();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
input,
select {
  width: 300px;
  padding: 0.4em 0;
  padding-left: 0.5em;
  border: 1px solid $c-border-grey;
}

.schools {
  background-color: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;
  text-align: left;

  @include breakpoint-above("medium") {
    margin: 40px;
    padding: 40px;
  }

  &__add-school--link {
    @include flex-container(row, flex-start, center);

    margin-bottom: 2em;
    border: 1px solid darken(#f7fcfe, 5%);
    width: 180px;
    padding: 1em 2em;
    background: #f7fcfe;
    border-radius: 20px;
    cursor: pointer;

    &:hover {
      background: darken(#f7fcfe, 3%);
      text-decoration: none;
    }
  }

  &__input-row {
    margin-bottom: 1em;
    margin-left: 0;
  }

  &__v-select--state {
    display: inline-block;
    width: 300px;
  }
}

.plus-icon {
  width: 12px;
  height: 12px;
  margin-right: 0.8em;
  & path {
    fill: $c-success-green;
  }
}

.list-wrapper {
  overflow-x: scroll;
}

.list {
  width: 800px;
}

.uc-form-label {
  width: 100px;
  text-align: left;
}

.uc-form-button {
  margin: 2em 0 4em 0;
  padding: 1em 1.6em;
  border: 1px solid $c-border-grey;
}
</style>
