<template>
  <router-link :to="`/admin/sessions/${session._id}`" class="session-list-item">
    <div class="session-list-item__column session-list-item__column">
      <div class="bold">{{ subTopicDisplayName }}</div>
      <div>{{ createdAt }}</div>
    </div>
    <div class="session-list-item__column">{{ status }}</div>
    <div class="session-list-item__column">
      <div>{{ messages }}</div>
    </div>
    <div class="session-list-item__column">
      <div>{{ session.studentFirstName }}</div>
    </div>
    <div class="session-list-item__column">
      <div>{{ studentRating }}</div>
    </div>
  </router-link>
</template>

<script>
import moment from "moment";
import { topics } from "@/utils/topics";

const pluralize = num => {
  return num === 1 ? "" : "s";
};

export default {
  name: "SessionListItem",

  props: {
    session: Object
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
        : this.session.numMessages;
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
.session-list-item {
  display: flex;
  justify-content: space-between;
  padding: 20px 40px;
  text-decoration: none;
  color: $c-soft-black;

  &:hover {
    cursor: pointer;
    background: #fbfbfb;
    text-decoration: none;
  }

  &__column {
    flex-basis: 100px;
    text-align: left;
    flex-grow: 1;

    display: flex;
    flex-direction: column;
    justify-content: center;
  }
}

.bold {
  font-weight: 600;
}
</style>
