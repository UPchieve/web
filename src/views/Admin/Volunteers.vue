<template>
  <div v-if="user.isAdmin">
    <div class="header">
      Volunteers
    </div>
    <div>
      <ul>
        <li class="pagination-item">
          <button type="button" @click="firstPage()" :disabled="onFirstPage()">
            First
          </button>
        </li>
        <li class="pagination-item">
          <button
            type="button"
            @click="previousPage()"
            :disabled="onFirstPage()"
          >
            Previous
          </button>
        </li>
        <li v-for="page in pages" :key="page.name" class="pagination-item">
          <button
            type="button"
            @click="middlePages(page.name)"
            :disabled="page.isDisabled"
            :class="{ active: isPageActive(page.name) }"
            class="middleBtns"
          >
            {{ page.name }}
          </button>
        </li>
        <li class="pagination-item">
          <button type="button" @click="nextPage()" :disabled="onLastPage()">
            Next
          </button>
        </li>
        <li class="pagination-item">
          <button type="button" @click="lastPage()" :disabled="onLastPage()">
            Last
          </button>
        </li>
      </ul>
    </div>
    <div class="wrapper">
      <table>
        <thead>
          <tr>
            <th v-for="key in volunteerProperties" v-bind:key="key.index">
              <div
                v-if="
                  key === 'firstname' || key === 'lastname' || key === '_id'
                "
              >
                <label>Search</label>
                <input
                  type="text"
                  v-model="appliedFilter[key]"
                  :placeholder="key"
                />
              </div>
              <div v-else-if="key === 'numberOfHours'">
                <label>less than</label>
                <input
                  type="text"
                  class="hoursInput"
                  v-model="appliedFilter[key]"
                  :placeholder="'#'"
                />
                <label>hour(s)</label>
              </div>
              <div v-else-if="key != 'Status'">
                <label>{{ key }}</label>
                <select v-model="appliedFilter[key]">
                  <option></option>
                  <option>True</option>
                  <option>False</option>
                </select>
              </div>
              <div v-else>
                <label>{{ key }}</label>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="volunteer in paginatedData" v-bind:key="volunteer._id">
            <td v-for="key in volunteerProperties" v-bind:key="key.index">
              <div v-if="key === '_id'">
                <router-link
                  :to="{
                    name: 'VolunteerProfile',
                    params: { id: volunteer._id }
                  }"
                >
                  {{ volunteer._id }}
                </router-link>
              </div>
              <div v-else-if="key === 'Status'">
                <div
                  v-if="
                    volunteer.isVolunteerApproved && volunteer.isVolunteerReady
                  "
                >
                  Approved and Ready!
                </div>
                <div
                  v-else-if="
                    volunteer.isVolunteerApproved && !volunteer.isVolunteerReady
                  "
                >
                  Approved
                </div>
                <div
                  v-else-if="
                    !volunteer.isVolunteerApproved &&
                      !volunteer.isVolunteerReady
                  "
                >
                  Hasn't Started
                </div>
                <div v-else>
                  Ready
                </div>
              </div>
              <div v-else>
                {{ volunteer[key] }}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import UserService from "@/services/UserService";

export default {
  data() {
    const user = UserService.getUser();

    var volunteerProperties = [
      "firstname",
      "lastname",
      "_id",
      "isVolunteerApproved",
      "hasCertification",
      "numberOfHours",
      "Status"
    ];

    return {
      user,
      search: "",
      volunteers: [],
      volunteerProperties,
      appliedFilter: {},
      perPage: 5,
      maxVisibleButtons: 3,
      currentPage: 0
    };
  },
  computed: {
    filteredItems() {
      var resultItems = this.volunteers;
      if (this.appliedFilter) {
        for (const field in this.appliedFilter) {
          const val = this.appliedFilter[field].toLowerCase();
          if (val) {
            resultItems = resultItems.filter(volunteer => {
              var result = volunteer[field];
              var hours = Infinity;
              if (typeof volunteer[field] === "boolean") {
                result = volunteer[field].toString();
              } else if (typeof volunteer[field] === "number") {
                hours = Number(this.appliedFilter[field]);
                return volunteer[field] < hours;
              }
              return result.toLowerCase().includes(val);
            });
          }
        }
      }
      return resultItems;
    },
    totalPages() {
      let l = this.filteredItems.length,
        s = this.perPage;
      return Math.ceil(l / s);
    },
    pages() {
      const range = [];
      for (let i = this.startPage; i <= this.endPage; i += 1) {
        range.push({
          name: i,
          isDisabled: i === this.currentPage
        });
      }
      return range;
    },
    paginatedData() {
      const start = this.currentPage * this.perPage;
      const end = start + this.perPage;
      return this.filteredItems.slice(start, end);
    },
    startPage() {
      if (this.currentPage <= 0) {
        return 0;
      }
      if (this.currentPage === this.totalPages - 1) {
        return Math.max(this.totalPages - this.maxVisibleButtons, 0);
      }
      return this.currentPage - 1;
    },
    endPage() {
      return Math.min(
        this.startPage + this.maxVisibleButtons - 1,
        this.totalPages - 1
      );
    }
  },
  created() {
    UserService.getVolunteers(this).then(volunteers => {
      this.volunteers = volunteers;
    });
  },
  methods: {
    isPageActive(page) {
      return this.currentPage === page;
    },
    firstPage() {
      this.currentPage = 0;
    },
    previousPage() {
      this.currentPage--;
    },
    middlePages(page) {
      this.currentPage = page;
    },
    nextPage() {
      this.currentPage++;
    },
    lastPage() {
      this.currentPage = this.totalPages - 1;
    },
    onFirstPage() {
      return this.currentPage === 0;
    },
    onLastPage() {
      return this.currentPage === this.totalPages - 1;
    }
  }
};
</script>

<style lang="scss" scoped>
.pagination {
  list-style-type: none;
}

.pagination-item {
  display: inline-block;
}

button {
  background-color: #e3f2fd;
  border: none;
  border-radius: 5px;
  margin: 3px;
}

.middleBtns {
  margin: 1px;
}
.active {
  background-color: #16d2aa;
  color: #ffffff;
}

body {
  font-family: "Work Sans", Helvetica, Arial, sans-serif;
  font-size: 14px;
}

table {
  border: none;
  background-color: #f0f8fd;
  margin: 30px;
  border-radius: 15px;
}

th {
  background-color: #e3f2fd;
  color: #2c3e50;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}
th:first-child {
  border-radius: 15px 0 0 0;
}

th:last-child {
  border-radius: 0 15px 0 0;
}
th,
td {
  min-width: 120px;
  padding: 10px 0px;
}

.header {
  display: flex;
  padding: 30px;
  margin: 0;
  font-size: 24px;
  border-bottom: 0.5px solid #cccccf;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #343440;
  margin-bottom: 30px;
}

input[type="text"] {
  display: block;
  margin: 0 auto;
  margin-bottom: 5px;
  color: #2c3e50;
  border: none;
  box-shadow: none;
  border-radius: 0;
  background-color: white;
  width: 90%;
}

input::placeholder {
  color: #73737a;
  text-align: center;
  font-weight: 400;
}

input[class="hoursInput"] {
  width: 25%;
}

select {
  display: block;
  margin: 0 auto;
  margin-bottom: 5px;
  color: #73737a;
  background: white;
}

label {
  display: block;
  margin: 0 auto;
  text-align: center;
  padding: 5px;
}
</style>
