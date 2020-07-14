<template>
  <div class="admin-reports">
    <reports-filter-panel
      :setSessionRangeFrom="setSessionRangeFrom"
      :setSessionRangeTo="setSessionRangeTo"
      :setHighSchool="setHighSchool"
      :setStudentPartnerOrg="setStudentPartnerOrg"
      :setJoinedBefore="setJoinedBefore"
      :setJoinedAfter="setJoinedAfter"
      :joinedBefore="joinedBefore"
      :joinedAfter="joinedAfter"
      :sessionRangeFrom="sessionRangeFrom"
      :sessionRangeTo="sessionRangeTo"
      :highSchool="highSchool"
      :studentPartnerOrg="studentPartnerOrg"
    />

    <button type="button" class="btn" @click="generateSessionReport">
      Generate Session Report
    </button>
    <button type="button" class="btn" @click="generateUsageReport">
      Generate Usage Report
    </button>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import ReportsFilterPanel from "@/components/ReportsFilterPanel";
import moment from "moment";

export default {
  name: "AdminReports",
  components: { ReportsFilterPanel },

  data() {
    return {
      joinedBefore: "",
      joinedAfter: "",
      sessionRangeFrom: "",
      sessionRangeTo: "",
      highSchool: "",
      studentPartnerOrg: ""
    };
  },
  methods: {
    async generateSessionReport() {
      const data = {
        joinedBefore: this.joinedBefore,
        joinedAfter: this.joinedAfter,
        sessionRangeFrom: this.sessionRangeFrom,
        sessionRangeTo: this.sessionRangeTo,
        highSchoolId: this.highSchool._id,
        studentPartnerOrg: this.studentPartnerOrg
      };

      const response = await NetworkService.adminGetSessionReport(data);
      const {
        body: { sessions }
      } = response;

      this.exportToCsv(
        `${this.fileTitle} ${this.todaysDate} Session Report`,
        sessions
      );
    },

    async generateUsageReport() {
      const data = {
        joinedBefore: this.joinedBefore,
        joinedAfter: this.joinedAfter,
        sessionRangeFrom: this.sessionRangeFrom,
        sessionRangeTo: this.sessionRangeTo,
        highSchoolId: this.highSchool._id,
        studentPartnerOrg: this.studentPartnerOrg
      };

      const response = await NetworkService.adminGetUsageReport(data);
      const {
        body: { students }
      } = response;

      this.exportToCsv(
        `${this.fileTitle} ${this.todaysDate} Usage Report`,
        students
      );
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

    setSessionRangeFrom(event) {
      const {
        target: { value }
      } = event;
      this.sessionRangeFrom = value;
    },

    setSessionRangeTo(event) {
      const {
        target: { value }
      } = event;
      this.sessionRangeTo = value;
    },

    setHighSchool(highSchool) {
      this.highSchool = highSchool;
    },

    setStudentPartnerOrg(event) {
      const {
        target: { value }
      } = event;
      this.studentPartnerOrg = value;
    },

    setJoinedBefore(event) {
      const {
        target: { value }
      } = event;
      this.joinedBefore = value;
    },

    setJoinedAfter(event) {
      const {
        target: { value }
      } = event;
      this.joinedAfter = value;
    }
  },
  computed: {
    todaysDate() {
      return moment().format("MMMM D");
    },
    fileTitle() {
      let title = "";
      if (this.highSchool.name) title = this.highSchool.name;
      if (this.studentPartnerOrg) title = this.studentPartnerOrg;

      return title;
    }
  }
};
</script>

<style lang="scss" scoped>
.admin-reports {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above("medium") {
    margin: 40px;
  }
}

.btn {
  height: 60px;
  background-color: white;
  border: 1px solid $c-border-grey;
  font-size: 16px;
  font-weight: 600;
  color: $c-success-green;
  width: 250px;
  margin-bottom: 1em;
  display: block;
  margin-left: 2em;

  &:hover {
    background-color: $c-success-green;
    color: white;
  }
}
</style>
