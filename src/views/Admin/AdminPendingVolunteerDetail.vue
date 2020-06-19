<template>
  <div v-if="showReferenceForm">
    <admin-reference-view
      :reference="volunteer.references[chosenReferenceIndex]"
      :closeReferenceView="toggleReferenceView"
      :updateReferenceStatus="updateReferenceStatus"
      :referenceStatusText="referencesStatus[chosenReferenceIndex]"
    />
  </div>
  <div v-else-if="volunteer._id" class="user-detail">
    <div class="user-detail__body">
      <div class="user-detail__title">
        {{ volunteer.firstname }} {{ volunteer.lastname }}
      </div>
      <div class="user-detail__subtitle">ID: {{ volunteer._id }}</div>
      <div class="user-detail__section">
        <div class="user-detail__section-title">Joined</div>
        <div>{{ createdAt }}</div>
      </div>
      <div class="user-detail__section">
        <div class="user-detail__section-title">Email</div>
        <div>{{ volunteer.email }}</div>
      </div>
      <div class="user-detail__section">
        <p class="user-detail__section-title">
          Photo Id
          <span
            class="user-detail__account-notice user-detail__status"
            :class="statusColor(photoIdStatus)"
            >{{ statusText(photoIdStatus) }}</span
          >
        </p>
        <div class="user-detail__photo-container">
          <img class="user-detail__photo" :src="volunteer.photoUrl" />
        </div>
        <div>{{ volunteer.photoId }}</div>
        <select name="photo-id-status" v-model="photoIdStatus">
          <option selected disabled value="SUBMITTED"
            >Review required...</option
          >
          <option value="REJECTED">Reject</option>
          <option value="APPROVED">Approve</option>
        </select>
      </div>
      <div class="user-detail__section" v-if="volunteer.linkedInUrl">
        <p class="user-detail__section-title">
          LinkedIn
          <span
            class="user-detail__account-notice user-detail__status"
            :class="statusColor(linkedInStatus)"
            >{{ statusText(linkedInStatus) }}</span
          >
        </p>
        <a :href="volunteer.linkedInUrl" target="_blank" rel="noopener">
          {{ volunteer.linkedInUrl }}
        </a>
        <select name="linked-in-status" v-model="linkedInStatus">
          <option value="SUBMITTED" selected disabled
            >Review required...</option
          >
          <option value="REJECTED">Reject</option>
          <option value="APPROVED">Approve</option>
        </select>
      </div>
      <div class="user-detail__section">
        <div class="user-detail__section-title">References</div>
        <div
          v-for="(reference, index) in volunteer.references"
          :key="reference._id"
        >
          <p>
            <span
              @click="toggleReferenceView(index)"
              class="reference-form-link"
              >{{ reference.name }}</span
            >
            {{ " " }}
            <span
              class="user-detail__account-notice user-detail__status"
              :class="statusColor(referencesStatus[index])"
              >{{ statusText(referencesStatus[index]) }}</span
            >
          </p>
        </div>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <large-button @click.native="handleSubmit" type="button" class="save-btn"
        >Save</large-button
      >
    </div>
  </div>
</template>

<script>
import moment from "moment";
import NetworkService from "@/services/NetworkService";
import AdminReferenceView from "@/views/Admin/AdminReferenceView";
import LargeButton from "@/components/LargeButton";

const getUser = async userId => {
  const {
    body: { user }
  } = await NetworkService.adminGetUser(userId);

  return user;
};

export default {
  name: "AdminPendingVolunteerDetail",
  components: { AdminReferenceView, LargeButton },
  data() {
    return {
      error: "",
      volunteer: {},
      photoIdStatus: "",
      linkedInStatus: "",
      showReferenceForm: false,
      chosenReferenceIndex: 0,
      referencesStatus: []
    };
  },
  async created() {
    this.volunteer = await getUser(this.$route.params.userId);
    this.photoIdStatus = this.volunteer.photoIdStatus;
    this.linkedInStatus = this.volunteer.linkedInStatus;
    this.referencesStatus = this.volunteer.references.map(
      reference => reference.status
    );
  },
  methods: {
    async handleSubmit() {
      this.error = "";
      const data = {
        photoIdStatus: this.photoIdStatus,
        linkedInStatus: this.linkedInStatus,
        referencesStatus: this.referencesStatus,
        volunteerId: this.volunteer._id
      };
      try {
        await NetworkService.adminReviewPendingVolunteer(data);
      } catch (error) {
        this.error = "There was an error updating the volunteer's status.";
      }
    },
    toggleReferenceView(referenceIndex) {
      this.chosenReferenceIndex = referenceIndex;
      this.showReferenceForm = !this.showReferenceForm;
    },
    updateReferenceStatus(event) {
      const {
        target: { value }
      } = event;
      this.referencesStatus = this.referencesStatus.map((status, index) => {
        if (index === this.chosenReferenceIndex) return value;
        else return status;
      });
    },
    statusText(status) {
      if (status === "SUBMITTED") return "WAITING FOR REVIEW";
      return status;
    },
    statusColor(status) {
      if (status === "SUBMITTED") return "user-detail__status--pending";
      if (status === "APPROVED") return "user-detail__status--approved";
      if (status === "REJECTED") return "user-detail__status--rejected";
    }
  },
  computed: {
    createdAt() {
      return moment(this.volunteer.createdAt).format("l, h:mm a");
    }
  }
};
</script>

<style lang="scss" scoped>
.user-detail {
  background: #fff;
  margin: 10px;
  border-radius: 8px;
  overflow: hidden;

  @include breakpoint-above("medium") {
    margin: 40px;
  }

  &__body {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: 20px 15px;

    @include breakpoint-above("medium") {
      padding: 40px;
    }
  }

  &__title {
    text-transform: capitalize;
    font-size: 24px;
    margin-top: 20px;
  }

  &__subtitle {
    color: $c-secondary-grey;
    font-size: 18px;
    margin-bottom: 20px;
  }

  &__account-notice {
    margin-right: 8px;
    font-size: 14px;
    border-radius: 3px;
    background: #000;
    color: #fff;
    padding: 5px 7px;
    font-weight: 500;
  }

  &__status {
    text-transform: capitalize;

    &--rejected {
      background-color: $c-error-red;
    }

    &--pending {
      background-color: $c-warning-orange;
    }

    &--approved {
      background-color: $c-success-green;
    }
  }

  &__section {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin: 10px 0;
    font-size: 20px;
  }

  &__section-title {
    color: $c-secondary-grey;
    font-size: 16px;
  }

  &__photo-container {
    width: 100%;
    @include breakpoint-above("medium") {
      width: 400px;
    }
  }

  &__photo {
    width: 100%;
  }
}

.reference-form-link {
  color: $c-information-blue;
  text-decoration: underline;
  cursor: pointer;
}

.save-btn {
  margin-top: 3em;
  color: #fff;
  background-color: $c-success-green;
  border: none;

  &:hover {
    background-color: darken($c-success-green, 5%);
  }
}

.error {
  color: $c-error-red;
  text-align: left;
  margin-top: 2em;
  font-size: 16px;
}
</style>
