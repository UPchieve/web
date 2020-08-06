<template>
  <div class="filter-panel">
    <div class="col">
      <div class="joined-container">
        <label for="joined-after" class="col">
          Joined after
          <input
            id="joined-after"
            type="date"
            :value="joinedAfter"
            @input="setJoinedAfter"
          />
        </label>

        <label for="joined-before" class="col">
          Joined before
          <input
            id="joined-before"
            type="date"
            :value="joinedBefore"
            @input="setJoinedBefore"
          />
        </label>
      </div>
    </div>

    <div class="col">
      <div class="session-range-container">
        <label for="session-range-from" class="col">
          Session from
          <input
            id="session-range-from"
            type="date"
            :value="sessionRangeFrom"
            @input="setSessionRangeFrom"
          />
        </label>

        <label for="session-range-to" class="col">
          Session to
          <input
            id="session-range-to"
            type="date"
            :value="sessionRangeTo"
            @input="setSessionRangeTo"
          />
        </label>
      </div>
    </div>

    <div class="col">
      <div>
        <label for="student-partner-org" class="col">
          Student partner org
          <v-select
            id="student-partner-org"
            class="student-partner-org"
            :options="partnerOrgs"
            :value="studentPartnerOrgDisplay"
            :searchable="true"
            @input="setStudentPartnerOrg"
            label="displayName"
          />
        </label>
      </div>
    </div>
    <div class="col">
      <div>
        <label for="high-school" class="col">
          High school
          <school-list
            class="high-school-list"
            :setHighSchool="setHighSchool"
            placeholder="Search for a school"
          />
        </label>
      </div>
    </div>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import SchoolList from "@/components/SchoolList";

export default {
  name: "FilterPanel",
  components: { SchoolList },
  props: {
    joinedAfter: {
      type: String,
      required: true
    },
    joinedBefore: {
      type: String,
      required: true
    },

    setJoinedAfter: {
      type: Function,
      required: true
    },
    setJoinedBefore: {
      type: Function,
      required: true
    },
    sessionRangeFrom: {
      type: String,
      required: true
    },
    sessionRangeTo: {
      type: String,
      required: true
    },
    setSessionRangeFrom: {
      type: Function,
      required: true
    },
    setSessionRangeTo: {
      type: Function,
      required: true
    },
    studentPartnerOrgDisplay: {
      type: String,
      required: true
    },
    setStudentPartnerOrg: {
      type: Function,
      required: true
    },
    setHighSchool: {
      type: Function,
      required: true
    }
  },
  data() {
    return {
      partnerOrgs: []
    };
  },
  async mounted() {
    const response = await NetworkService.adminGetStudentPartners();
    const {
      body: { partnerOrgs }
    } = response;
    this.partnerOrgs = partnerOrgs;
  }
};
</script>

<style lang="scss" scoped>
.filter-panel {
  @include flex-container(row, space-between, flex-start);
  flex-wrap: wrap;
  margin: 10px;
  border-radius: 8px;

  @include breakpoint-above("medium") {
    margin: 40px;
  }
}
.joined-container {
  @include flex-container(row);
}

.session-range-container {
  @include flex-container(row);
}

.col {
  @include flex-container(column, flex-start, flex-start);
  margin: 0.4em 0;
  @include breakpoint-above("medium") {
    margin-right: 10px;
  }
}

.student-partner-org {
  width: 400px;
}

.high-school-list {
  width: 400px;
}

.btn {
  height: 60px;
  background-color: white;
  border: 1px solid $c-border-grey;
  font-size: 16px;
  font-weight: 600;
  color: $c-success-green;

  &:hover {
    background-color: $c-success-green;
    color: white;
  }
}
</style>
