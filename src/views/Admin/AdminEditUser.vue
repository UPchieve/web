<template>
  <div class="edit-container">
    <button class="back-button" @click="goBack" type="button">← Back</button>

    <form class="col" @submit="submitUpdate">
      <div class="row">
        <label for="first-name" class="uc-form-label">First name</label>
        <input id="first-name" type="text" v-model="firstName" />
      </div>
      <div class="row">
        <label for="last-name" class="uc-form-label">Last name</label>
        <input id="last-name" type="text" v-model="lastName" />
      </div>
      <div class="row">
        <label for="email" class="uc-form-label">Email</label>
        <input id="email" type="text" v-model="email" />
      </div>
      <div class="row">
        <label for="partner-org" class="uc-form-label">
          Partner org
        </label>
        <v-select
          id="partner-org"
          class="option-select"
          :options="listedPartnerOrgs"
          label="displayName"
          v-model="partnerOrg"
        />
      </div>
      <div
        class="row"
        v-if="!user.isVolunteer && partnerOrg && partnerOrg.sites"
      >
        <label for="partner-site" class="uc-form-label">Partner Site</label>
        <v-select
          id="partner-sites"
          class="option-select"
          :options="partnerOrg.sites"
          v-model="partnerSite"
        />
      </div>

      <div class="row">
        <label for="verified" class="uc-form-label">Verified</label>
        <select name="verified" id="verified" v-model="isVerified">
          <option
            v-for="option in options"
            :value="option.value"
            :key="option.text"
          >
            {{ option.text }}
          </option>
        </select>
      </div>
      <div class="row">
        <label for="banned" class="uc-form-label">Banned</label>
        <select name="banned" id="banned" v-model="isBanned">
          <option
            v-for="option in options"
            :value="option.value"
            :key="option.text"
          >
            {{ option.text }}
          </option>
        </select>
      </div>
      <div class="row">
        <label for="deactivated" class="uc-form-label">Deactivated</label>
        <select name="deactivated" id="deactivated" v-model="isDeactivated">
          <option
            v-for="option in options"
            :value="option.value"
            :key="option.text"
          >
            {{ option.text }}
          </option>
        </select>
      </div>
      <div class="row" v-if="user.isVolunteer">
        <label for="approved" class="uc-form-label">Approved</label>
        <select name="approved" id="approved" v-model="isApproved">
          <option
            v-for="option in options"
            :value="option.value"
            :key="option.text"
          >
            {{ option.text }}
          </option>
        </select>
      </div>
      <p class="error" v-if="error">{{ error }}</p>
      <button class="uc-form-button">
        Update
      </button>
    </form>
  </div>
</template>

<script>
import NetworkService from "@/services/NetworkService";
import { isEmpty } from "lodash";

export default {
  name: "AdminEditUser",

  props: {
    user: { type: Object, required: true },
    toggleEditMode: { type: Function, required: true },
    getUser: { type: Function, required: true }
  },

  data() {
    return {
      firstName: "",
      lastName: "",
      email: "",
      partnerOrg: {},
      partnerSite: "",
      isVerified: false,
      isBanned: false,
      isDeactivated: false,
      isApproved: false,
      options: [{ text: "False", value: false }, { text: "True", value: true }],
      error: "",
      listedPartnerOrgs: []
    };
  },
  async created() {
    if (this.user.isVolunteer) {
      const response = await NetworkService.adminGetVolunteerPartners();
      const {
        body: { partnerOrgs }
      } = response;
      this.listedPartnerOrgs = partnerOrgs;
    } else {
      const response = await NetworkService.adminGetStudentPartners();
      const {
        body: { partnerOrgs }
      } = response;
      this.listedPartnerOrgs = partnerOrgs;
    }

    this.firstName = this.user.firstname;
    this.lastName = this.user.lastname;
    this.email = this.user.email;
    this.partnerSite = this.user.partnerSite || "";
    this.isVerified = this.user.verified;
    this.isBanned = this.user.isBanned;
    this.isDeactivated = this.user.isDeactivated;
    this.isApproved = this.user.isApproved;
    this.partnerOrg = {};

    for (let org of this.listedPartnerOrgs) {
      if (
        org.key === this.user.studentPartnerOrg ||
        org.key === this.user.volunteerPartnerOrg
      ) {
        this.partnerOrg = org;
        break;
      }
    }
  },

  methods: {
    async submitUpdate(event) {
      event.preventDefault();
      const data = {
        firstName: this.firstName,
        lastName: this.lastName,
        email: this.email,
        partnerOrg: isEmpty(this.partnerOrg) ? "" : this.partnerOrg.key,
        partnerSite: "",
        isVerified: this.isVerified,
        isBanned: this.isBanned,
        isDeactivated: this.isDeactivated,
        isApproved: this.isApproved
      };

      if (
        !isEmpty(this.partnerOrg) &&
        this.partnerOrg.sites &&
        this.partnerOrg.sites.includes(this.partnerSite)
      ) {
        data.partnerSite = this.partnerSite;
      }

      try {
        await NetworkService.adminUpdateUser(this.user._id, data);

        this.getUser();
        this.toggleEditMode();
      } catch (error) {
        this.error = "There was a problem updating the user.";
      }
    },
    goBack() {
      this.toggleEditMode();
    }
  }
};
</script>

<style lang="scss" scoped>
input,
select {
  width: 400px;
  padding: 0.4em 0;
  padding-left: 0.5em;
  border: 1px solid #d6e0ef;
}

.edit-container {
  text-align: left;
  margin: 40px;
}
.row {
  margin-bottom: 1em;
  margin-left: 0;
}
.uc-form-label {
  width: 100px;
  text-align: left;
}
.uc-form-button {
  margin-top: 2em;
  padding: 1em 1.6em;
  border: 1px solid $c-border-grey;
}

.option-select {
  display: inline-block;
  width: 400px;
}

.back-button {
  border: none;
  background-color: transparent;
  color: #417db1;
  padding: 0.4em 1em;
  margin-bottom: 2em;
  cursor: pointer;

  &:hover {
    border-radius: 20px;
    background: #f7fcfe;
  }
}

.error {
  color: $c-error-red;
  margin: 2em 0;
}
</style>
