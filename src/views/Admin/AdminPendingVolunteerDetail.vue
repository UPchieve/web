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
      <button class="edit-btn btn" @click="toggleEditMode()">
        Edit
      </button>
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
        <div class="user-detail__section-title ">
          Photo Id
          <span
            class="user-detail__account-notice user-detail__status"
            :class="statusColor(photoIdStatus)"
            >{{ statusText(photoIdStatus) }}</span
          >
          <select
            name="photo-id-status"
            v-model="photoIdStatus"
            class="user-detail__photo-id-select"
          >
            <option selected disabled value="SUBMITTED"
              >Review required...</option
            >
            <option value="REJECTED">Reject</option>
            <option value="APPROVED">Approve</option>
          </select>
        </div>
        <div class="user-detail__photo-container">
          <img class="user-detail__photo" :src="volunteer.photoUrl" />
        </div>
        <div>{{ volunteer.photoId }}</div>
      </div>
      <div class="user-detail__section">
        <div class="user-detail__section-title">References</div>
        <div
          v-for="(reference, index) in volunteer.references"
          :key="reference._id"
          class="reference"
        >
          <p>
            <span
              @click="toggleReferenceView(index)"
              class="reference__form-link"
              >{{ reference.firstName }} {{ reference.lastName }}</span
            >
            {{ " " }}
            <span
              class="user-detail__account-notice user-detail__status"
              :class="statusColor(referencesStatus[index])"
              >{{ statusText(referencesStatus[index]) }}</span
            >
          </p>
          <p class="reference__email">
            {{ reference.email }}
          </p>
        </div>
      </div>
      <div class="user-detail__section">
        <div class="user-detail__section-title ">
          Background Information
          <span
            class="user-detail__account-notice user-detail__status"
            :class="
              statusColor(hasCompletedBackgroundInfo ? 'APPROVED' : 'SUBMITTED')
            "
            >{{
              statusText(hasCompletedBackgroundInfo ? "COMPLETED" : "PENDING")
            }}</span
          >
        </div>
        <background-info v-if="hasCompletedBackgroundInfo" :user="volunteer" />
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
import BackgroundInfo from "@/components/Admin/BackgroundInfo";

export default {
  name: "AdminPendingVolunteerDetail",
  components: { AdminReferenceView, LargeButton, BackgroundInfo },
  props: {
    volunteer: { type: Object, required: true },
    toggleEditMode: { type: Function, required: true }
  },
  data() {
    return {
      error: "",
      photoIdStatus: "",
      showReferenceForm: false,
      chosenReferenceIndex: 0,
      referencesStatus: []
    };
  },
  async created() {
    this.photoIdStatus = this.volunteer.photoIdStatus;
    this.referencesStatus = this.volunteer.references.map(
      reference => reference.status
    );
  },
  methods: {
    async handleSubmit() {
      this.error = "";

      const data = {
        photoIdStatus: this.photoIdStatus,
        referencesStatus: this.referencesStatus,
        volunteerId: this.volunteer._id
      };
      try {
        await NetworkService.adminReviewPendingVolunteer({
          volunteerId: this.volunteer._id,
          data
        });
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
      if (status === "SUBMITTED" || status === "PENDING")
        return "user-detail__status--pending";
      if (status === "APPROVED") return "user-detail__status--approved";
      if (status === "REJECTED") return "user-detail__status--rejected";
    }
  },
  computed: {
    createdAt() {
      return moment(this.volunteer.createdAt).format("l, h:mm a");
    },
    hasCompletedBackgroundInfo() {
      return (
        this.volunteer.occupation &&
        this.volunteer.occupation.length > 0 &&
        this.volunteer.country
      );
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

  &__photo-id-select {
    margin-bottom: 0.8em;
  }
}

.reference {
  margin-bottom: 1em;
  text-align: left;

  &__form-link {
    color: $c-information-blue;
    text-decoration: underline;
    cursor: pointer;
  }
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

.edit-btn {
  @include font-category("body");
  background-color: $c-success-green;
  border-radius: 30px;
  width: 120px;
  height: 40px;
  font-weight: 600;
  color: white;
  margin-left: auto;

  &:hover {
    color: #2c3e50;
  }
}
</style>
