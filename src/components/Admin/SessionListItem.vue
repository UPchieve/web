<template>
  <router-link :to="`/admin/sessions/${session._id}`" class="session-list-link">
    <div class="session-list-item">
      <div class="session-list-item__column session-list-item__column">
        <span class="bold">{{ subTopicDisplayName }}</span>
        <span>{{ createdAt }}</span>
      </div>
      <span class="session-list-item__column">{{ status }}</span>
      <div class="session-list-item__column">
        <span>{{ messages }}</span>
      </div>
      <div class="session-list-item__column">
        <span>{{ session.studentFirstName }}</span>
      </div>
      <div class="session-list-item__column">
        <span>{{ studentRating }}</span>
      </div>
    </div>
    <session-flags :flags="session.flags" />
  </router-link>
</template>

<script>
import moment from "moment";
import { topics } from "@/utils/topics";
import SessionFlags from "./SessionFlags";

const pluralize = num => {
  return num === 1 ? "" : "s";
};

export default {
  name: "SessionListItem",
  props: {
    session: Object
  },
  components: {
    SessionFlags
  },

  computed: {
    createdAt() {
      return moment(this.session.createdAt).format("l, h:mm a");
    },

    status() {
      if (!this.session.endedAt) {
        if (!this.session.volunteer) return "⌛ Student waiting";
        else return "✅ Paired, in progress";
      } else {
        if (!this.session.volunteer) return "❌ Not paired";
        else return "✅ Paired, ended";
      }
    },

    messages() {
      const numMsgs = this.session.messages
        ? this.session.messages.length
        : this.session.totalMessages;
      return `${numMsgs} message${pluralize(numMsgs)}`;
    },

    subTopicDisplayName() {
      const { type, subTopic } = this.session;
      return topics[type].subtopics[subTopic].displayName;
    },

    studentRating() {
      return this.session.studentRating ? this.session.studentRating : "-";
    }
  }
};
</script>

<style lang="scss" scoped>
.session-list {
  &-item {
    display: flex;
    justify-content: space-between;
    text-decoration: none;
    color: $c-soft-black;

    &__column {
      flex-basis: 100px;
      text-align: left;
      flex-grow: 1;

      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  }

  &-link {
    display: inline-block;
    width: 100%;
    padding: 20px 40px;

    &:hover {
      cursor: pointer;
      background-color: #fbfbfb;
      text-decoration: none;
    }
  }
}

.bold {
  font-weight: 600;
}
</style>
