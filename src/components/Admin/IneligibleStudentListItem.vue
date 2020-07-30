<template>
  <tr class="list-item">
    <td class="list-item__column">
      {{ createdAt }}
    </td>
    <td class="list-item__column">
      {{ email }}
    </td>
    <td class="list-item__column">
      {{ student.medianIncome }}
    </td>
    <td class="list-item__column">
      <div>{{ student.zipCode }}</div>
    </td>
    <td class="list-item__column">
      <router-link :to="`/admin/school/${student.schoolId}`">
        <div>{{ student.schoolName }}</div>
        <div>
          {{ student.schoolCity }}, {{ student.schoolState }},
          {{ student.schoolZipCode }}
        </div>
      </router-link>
    </td>
    <td>
      {{ schoolApprovalStatus }}
    </td>
  </tr>
</template>

<script>
import moment from "moment";

export default {
  name: "IneligibleStudentListItem",

  props: {
    student: Object
  },

  computed: {
    createdAt() {
      return moment(this.student.createdAt).format("l, h:mm a");
    },
    email() {
      return this.student.email || "--";
    },
    schoolApprovalStatus() {
      return this.student.isApproved ? "Approved" : "Not approved";
    }
  }
};
</script>

<style lang="scss" scoped>
.list-item {
  padding: 20px 40px;
  text-decoration: none;
  color: $c-soft-black;

  &:hover {
    text-decoration: none;
  }

  &__column {
    padding: 20px 40px;
    flex-basis: 100px;
    text-align: left;
    flex-grow: 1;
  }
}

.bold {
  font-weight: 600;
}
</style>
