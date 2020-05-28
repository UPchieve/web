<template>
  <div class="filter-panel">
    <div class="col">
      <div>
        <label for="show-banned-users" class="show-user-type-label"
          >Show banned users</label
        >
        <input
          id="show-banned-users"
          type="checkbox"
          :value="showBannedUsers"
          @change="toggleShowBannedUsers"
        />
      </div>
      <div>
        <label for="show-test-users" class="show-user-type-label"
          >Show test users</label
        >
        <input
          id="show-test-users"
          type="checkbox"
          :value="showTestUsers"
          @change="toggleShowTestUsers"
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
          :value="minMessagesSent"
          @input="setMinMessagesSent"
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
          :value="minSessionLength"
          @input="setMinSessionLength"
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
            @input="setSessionActivityFrom"
            :value="sessionActivityFrom"
          />
        </label>

        <label for="session-activity-to" class="col"
          >to
          <input
            id="session-activity-to"
            type="date"
            :value="sessionActivityTo"
            @input="setSessionActivityTo"
          />
        </label>
      </div>
    </div>

    <div>
      <button class="btn" type="button" @click="submitFilters">
        Update
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "FilterPanel",
  props: {
    showBannedUsers: {
      type: String,
      required: true
    },
    showTestUsers: {
      type: String,
      required: true
    },
    sessionActivityFrom: {
      type: String,
      required: true
    },
    sessionActivityTo: {
      type: String,
      required: true
    },
    minMessagesSent: {
      type: Number,
      required: true
    },
    minSessionLength: {
      type: Number,
      required: true
    },
    toggleShowBannedUsers: {
      type: Function,
      required: true
    },
    toggleShowTestUsers: {
      type: Function,
      required: true
    },
    setSessionActivityFrom: {
      type: Function,
      required: true
    },
    setSessionActivityTo: {
      type: Function,
      required: true
    },
    setMinMessagesSent: {
      type: Function,
      required: true
    },
    setMinSessionLength: {
      type: Function,
      required: true
    },
    submitFilters: {
      type: Function,
      required: true
    }
  },

  computed: {
    _showBannedUsers() {
      return this.showBannedUsers;
    }
  }
};
</script>

<style lang="scss" scoped>
input[type="number"] {
  width: 60px;
}

.filter-panel {
  @include flex-container(row, space-between, flex-start);
  flex-wrap: wrap;
  margin: 10px;
  border-radius: 8px;

  @include breakpoint-above("medium") {
    margin: 40px;
  }
}
.session-activity-container {
  @include flex-container(row);
}

.col {
  @include flex-container(column, flex-start, flex-start);
  @include breakpoint-above("medium") {
    margin-right: 10px;
  }
}

.show-user-type-label {
  width: 140px;
  text-align: left;
}

.min-session-container {
  margin-top: 0.4em;
}

.min-length-label {
  width: 180px;
  text-align: left;

  &:nth-of-type(2) {
    margin-top: 0.2em;
  }
}

.min-session-length {
  display: inline-block;
  vertical-align: top;
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
