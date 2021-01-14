<template>
  <div class="admin-reports">
    <div class="filter-panel">
      <div class="col">
        <div class="filter-panel__joined">
          <label for="joined-after" class="col">
            Joined after
            <input id="joined-after" type="date" v-model="joinedAfter" />
          </label>

          <label for="joined-before" class="col">
            Joined before
            <input id="joined-before" type="date" v-model="joinedBefore" />
          </label>
        </div>
      </div>

      <div class="col">
        <div class="filter-panel__session-range">
          <label for="session-range-from" class="col">
            Session from
            <input
              id="session-range-from"
              type="date"
              v-model="sessionRangeFrom"
            />
          </label>

          <label for="session-range-to" class="col">
            Session to
            <input id="session-range-to" type="date" v-model="sessionRangeTo" />
          </label>
        </div>
      </div>

      <div class="col">
        <div>
          <label for="student-partner-org" class="col">
            Student partner org
            <v-select
              id="student-partner-org"
              class="filter-panel__partner-select"
              :options="listedPartnerOrgs"
              label="displayName"
              v-model="studentPartnerOrg"
            />
          </label>
        </div>
        <div class="col" v-if="studentPartnerOrg && studentPartnerOrg.sites">
          <label for="partner-site">Partner Site</label>
          <v-select
            id="partner-sites"
            class="filter-panel__partner-select"
            :options="partnerSites"
            v-model="studentPartnerSite"
          />
        </div>
      </div>
      <div class="col">
        <div>
          <label for="high-school" class="col">
            High school
            <school-list
              class="filter-panel__high-school-list"
              :setHighSchool="setHighSchool"
              placeholder="Search for a school"
            />
          </label>
        </div>
      </div>
    </div>

    <p class="error">{{ error }}</p>
    <Loader v-if="isGeneratingReport" />

    <button
      type="button"
      class="report-btn"
      @click="generateSessionReport"
      :disabled="isGeneratingReport"
    >
      Generate Session Report
    </button>
    <button
      type="button"
      class="report-btn"
      @click="generateUsageReport"
      :disabled="isGeneratingReport"
    >
      Generate Usage Report
    </button>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import SchoolList from "@/components/SchoolList";
import Loader from "@/components/Loader";
import moment from "moment";

export default {
  name: "AdminReports",
  components: { SchoolList, Loader },

  data() {
    return {
      joinedBefore: "",
      joinedAfter: "",
      sessionRangeFrom: "",
      sessionRangeTo: "",
      highSchool: "",
      studentPartnerOrg: {},
      studentPartnerSite: "",
      listedPartnerOrgs: [],
      error: "",
      isGeneratingReport: false
    };
  },
  async mounted() {
    const response = await NetworkService.adminGetStudentPartners();
    const {
      body: { partnerOrgs }
    } = response;
    this.listedPartnerOrgs = partnerOrgs;
  },
  methods: {
    async generateSessionReport() {
      if (this.isGeneratingReport) return;
      this.isGeneratingReport = true;
      this.error = "";

      const data = {
        joinedBefore: this.joinedBefore,
        joinedAfter: this.joinedAfter,
        sessionRangeFrom: this.sessionRangeFrom,
        sessionRangeTo: this.sessionRangeTo,
        highSchoolId: this.highSchool._id ? this.highSchool._id : "",
        // partner org can be "null" from clearing the v-select, check for if exists and then get the partnerOrg
        studentPartnerOrg: this.isValidStudentPartnerOrg
          ? this.studentPartnerOrg.key
          : "",
        studentPartnerSite: this.isValidPartnerSite
          ? this.studentPartnerSite
          : ""
      };

      try {
        const response = await NetworkService.adminGetSessionReport(data);
        const {
          body: { sessions }
        } = response;

        if (sessions.length === 0) {
          this.error = "No sessions meet the criteria";
        } else {
          this.exportToCsv(
            `${this.fileTitle} ${this.todaysDate} Session Report`,
            sessions
          );
        }

        this.isGeneratingReport = false;
      } catch (error) {
        this.isGeneratingReport = false;
      }
    },

    async generateUsageReport() {
      if (this.isGeneratingReport) return;
      this.isGeneratingReport = true;
      this.error = "";

      const data = {
        joinedBefore: this.joinedBefore,
        joinedAfter: this.joinedAfter,
        sessionRangeFrom: this.sessionRangeFrom,
        sessionRangeTo: this.sessionRangeTo,
        highSchoolId: this.highSchool._id ? this.highSchool._id : "",
        // partner org can be "null" from clearing the v-select, check for if exists and then get the partnerOrg
        studentPartnerOrg: this.isValidStudentPartnerOrg
          ? this.studentPartnerOrg.key
          : "",
        studentPartnerSite: this.isValidPartnerSite
          ? this.studentPartnerSite
          : ""
      };

      try {
        const response = await NetworkService.adminGetUsageReport(data);
        const {
          body: { students }
        } = response;

        if (students.length === 0) {
          this.error = "No students meet the criteria";
        } else {
          this.exportToCsv(
            `${this.fileTitle} ${this.todaysDate} Usage Report`,
            students
          );
        }
        this.isGeneratingReport = false;
      } catch (error) {
        this.isGeneratingReport = false;
      }
    },

    // https://gist.github.com/changhuixu/de092ee55a9e115abba988910bd68d41#file-csv-data-service-ts
    exportToCsv(filename, rows) {
      if (!rows || !rows.length) {
        return;
      }
      const separator = ",";
      const keys = Object.keys(rows[0]);
      const csvContent =
        keys.join(separator) +
        "\n" +
        rows
          .map(row => {
            return keys
              .map(k => {
                let cell =
                  row[k] === null || row[k] === undefined ? "" : row[k];
                cell =
                  cell instanceof Date
                    ? cell.toLocaleString()
                    : cell.toString().replace(/"/g, '""');
                if (cell.search(/("|,|\n)/g) >= 0) {
                  cell = `"${cell}"`;
                }
                return cell;
              })
              .join(separator);
          })
          .join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      if (navigator.msSaveBlob) {
        // IE 10+
        navigator.msSaveBlob(blob, filename);
      } else {
        const link = document.createElement("a");
        if (link.download !== undefined) {
          // Browsers that support HTML5 download attribute
          const url = URL.createObjectURL(blob);
          link.setAttribute("href", url);
          link.setAttribute("download", filename);
          link.style.visibility = "hidden";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    },

    setHighSchool(highSchool) {
      this.highSchool = highSchool;
    }
  },
  computed: {
    todaysDate() {
      return moment().format("MMMM D");
    },
    fileTitle() {
      let title = "";
      if (this.highSchool.name) title = this.highSchool.name;
      if (this.studentPartnerOrg && this.studentPartnerOrg.displayName)
        title = this.studentPartnerOrg.displayName;
      if (this.isValidPartnerSite) title = this.studentPartnerSite;

      return title;
    },
    partnerSites() {
      if (this.studentPartnerOrg && this.studentPartnerOrg.sites)
        return ["All sites", ...this.studentPartnerOrg.sites];
      return [];
    },
    isValidPartnerSite() {
      return (
        this.studentPartnerOrg &&
        this.studentPartnerOrg.sites &&
        this.studentPartnerOrg.sites.includes(this.studentPartnerSite)
      );
    },
    isValidStudentPartnerOrg() {
      return this.studentPartnerOrg && this.studentPartnerOrg.key;
    }
  }
};
</script>

<style lang="scss" scoped>
.admin-reports {
  background: #fff;
  margin: 10px;
  padding: 10px;
  border-radius: 8px;

  @include breakpoint-above("medium") {
    margin: 40px;
    padding: 40px;
  }
}

.filter-panel {
  @include flex-container(row, space-between, flex-start);
  flex-wrap: wrap;
  border-radius: 8px;

  &__joined {
    @include flex-container(row);
  }

  &__session-range {
    @include flex-container(row);
  }

  &__partner-select,
  &__high-school-list {
    width: 400px;
  }
}

.col {
  @include flex-container(column, flex-start, flex-start);
  margin: 0.4em 0;
  @include breakpoint-above("medium") {
    margin-right: 10px;
  }
}

.report-btn {
  height: 60px;
  background-color: white;
  border: 1px solid $c-border-grey;
  font-size: 16px;
  font-weight: 600;
  color: $c-success-green;
  width: 250px;
  margin-bottom: 1em;
  display: block;

  &:hover {
    background-color: $c-success-green;
    color: white;
  }

  &:disabled {
    color: $c-background-grey;
    background-color: $c-secondary-grey;
  }
}

.error {
  color: $c-error-red;
  text-align: left;
  margin: 2em 0;
  font-size: 16px;
}
</style>
