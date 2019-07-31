<template>
  <div>
    <template v-if="!user.isVolunteerApproved">
      <div>
        <h3>
          You need to be approved! In order to be approved, you need to do the
          following:
        </h3>
        <div id="checkbox-container" class="checklist">
          <div v-for="type in checklist" :key="type.index">
            <input
              type="checkbox"
              :id="type"
              v-model="user.onboarding[type].submitted"
              @change="save()"
            />
            <label :for="type">&nbsp; {{ user.onboarding[type].displayName }}</label>
          </div>
        </div>
      </div>
    </template>
    <template v-else-if="user.isVolunteerApproved && !user.isVolunteerReady">
      <h3>You are approved! The next steps you need to take are:</h3>
      <div class="checklist">
        <div v-if="!user.hasAvailability">
          Schedule at least 1 hour of availability
        </div>
        <div v-if="!user.hasCertification">
          Get certified in at least 1 subject
        </div>
      </div>
    </template>
  </div>
</template>

<script>
import UserService from "@/services/UserService";

export default {
  data() {
    const user = UserService.getUser() || {};
    var checklist = [
      "identityProof",
      "eduProof",
      "providedRefs",
      "signedAgreement",
      "scheduleCall"
    ];
    return {
      user,
      checklist,
      editBtnMsg: "Save",
      activeEdit: false,
      saveFail: false
    };
  },
  methods: {
    save() {
      UserService.editVolunteer(this, this.user).then(
        () => {
          this.activeEdit = false;
          this.saveFailed = false;
        },
        () => {
          this.saveFailed = true;
        }
      );
    }
  }
};
</script>

<style lang="scss" scoped>
.checklist {
  padding: 20px 25px;
  font-size: 16px;
  text-align: left;
}

#checkbox-container {
  margin: 10px 5px;
  text-align: left;
  padding: 25px;
}

#checkbox-container div {
  margin-bottom: 5px;
}

#checkbox-container button {
  margin-top: 5px;
}

input[type="text"] {
  padding: 0.5em 0.6em;
  display: inline-block;
  border: 1px solid #ccc;
  box-shadow: inset 0 1px 3px #ddd;
  border-radius: 4px;
}

h3 {
  padding: 0px 25px;
}
</style>
