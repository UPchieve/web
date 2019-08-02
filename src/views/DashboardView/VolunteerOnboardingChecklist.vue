<template>
  <div>
    <template v-if="!user.isVolunteerApproved">
      <div>
        <h3>
          You need to be approved! To be approved, you need to do the following:
        </h3>
        <div class="checklist">
          <div class="dropdown">
            <div class="round" v-for="type in checklist" :key="type.index">
              <div
                :class="{ active: !user.onboarding[type].submitted }"
                class="dropdown__header"
                @click="toggleDropdown($event)"
              >
                <input
                  type="checkbox"
                  :id="type"
                  v-model="user.onboarding[type].submitted"
                  @change="save()"
                />
                <label :for="type"></label>
                &nbsp; {{ user.onboarding[type].displayName }}
                <i class="fa fa-angle-down" aria-hidden="true"></i>
                <i class="fa fa-angle-up" aria-hidden="true"></i>
              </div>
              <div class="dropdown__content">
                {{ user.onboarding[type].description }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-if="!user.isVolunteerReady">
      <h3>You need to get ready! The next steps you need to take are:</h3>
      <ul class="checklist">
        <li v-if="!user.hasAvailability">
          Schedule at least 1 hour of availability
        </li>
        <li v-if="!user.hasCertification">
          Get certified in at least 1 subject
        </li>
      </ul>
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
    },
    toggleDropdown(event) {
      event.currentTarget.classList.toggle("active");
    }
  }
};
</script>

<style lang="scss" scoped>
.checklist {
  font-size: 16px;
  text-align: left;
  margin: 15px 30px;
}

input[type="text"] {
  padding: 0.5em 0.6em;
  display: inline-block;
  border: 1px solid #ccc;
  box-shadow: inset 0 1px 3px #ddd;
  border-radius: 4px;
}

h3 {
  padding: 0px 15px;
  margin-top: 0px;
}
.round {
  position: relative;
}

.round label {
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 50%;
  cursor: pointer;
  height: 28px;
  left: 0;
  position: absolute;
  top: 10px;
  width: 28px;
}

.round label:after {
  border: 2px solid #fff;
  border-top: none;
  border-right: none;
  content: "";
  height: 6px;
  left: 7px;
  opacity: 0;
  position: absolute;
  top: 8px;
  transform: rotate(-45deg);
  width: 12px;
}

.round input[type="checkbox"] {
  visibility: hidden;
}

.round input[type="checkbox"]:checked + label {
  background-color: #16d2aa;
  border-color: #16d2aa;
}

.round input[type="checkbox"]:checked + label:after {
  opacity: 1;
}

.dropdown {
  &__header {
    cursor: pointer;
    line-height: 50px;
    padding-left: 10px;
    padding-right: 50px;
    position: relative;
    text-overflow: ellipsis;
    i.fa {
      border: solid #2c3e50;
      border-width: 0 3px 3px 0;
      display: inline-block;
      padding: 3px;
      position: absolute;
      right: 10px;
      top: 40%;
      &.fa-angle-up {
        opacity: 0;
      }
      &.fa-angle-down {
        transform: rotate(45deg);
        -webkit-transform: rotate(45deg);
        opacity: 1;
      }
    }
    &.active {
      i.fa {
        &.fa-angle-up {
          transform: rotate(-135deg);
          -webkit-transform: rotate(-135deg);
          opacity: 1;
        }
        &.fa-angle-down {
          transform: rotate(45deg);
          -webkit-transform: rotate(45deg);
          opacity: 0;
        }
      }
      + .dropdown__content {
        height: auto;
        opacity: 1;
        visibility: visible;
      }
    }
  }
  &__content {
    height: 0;
    opacity: 0;
    overflow: hidden;
    transition: opacity 0.3s;
    visibility: hidden;
  }
}
</style>
