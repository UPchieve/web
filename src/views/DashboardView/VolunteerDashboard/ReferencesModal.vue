<template>
  <modal :closeModal="closeModal">
    <div class="reference-modal">
      <header>
        <h1 class="title">Reference check</h1>
        <cross-icon class="upc-modal-close-icon" @click="closeModal" />
      </header>
      <div>
        <p>
          Please provide us with two references we may contact. We will reach
          out to them via email and ask them to fill out a short form.
        </p>

        <div class="references-container">
          <div
            v-for="(reference, index) in references"
            :key="reference.email"
            class="reference"
          >
            <div class="reference-header">
              <h4>Reference {{ index + 1 }}</h4>
              <trash-icon
                class="trash-icon"
                v-if="reference.status !== 'APPROVED'"
                @click="removeReference(index)"
              />
            </div>
            <p>{{ reference.firstName }} {{ reference.lastName }}</p>
            <p>{{ reference.email }}</p>
            <div class="reference-status">
              <span
                class="reference-status-indicator"
                :class="{
                  approved: reference.status === 'APPROVED',
                  pending:
                    reference.status === 'UNSENT' ||
                    reference.status === 'SENT' ||
                    reference.status === 'SUBMITTED',
                  rejected: reference.status === 'REJECTED'
                }"
              ></span>
              <span>
                <template
                  v-if="
                    reference.status === 'UNSENT' || reference.status === 'SENT'
                  "
                >
                  WAITING ON RESPONSE
                </template>
                <template v-else-if="reference.status === 'SUBMITTED'">
                  IN REVIEW
                </template>
                <template v-else-if="reference.status === 'APPROVED'">
                  APPROVED
                </template>
                <template v-else-if="reference.status === 'REJECTED'">
                  REJECTED
                </template>
              </span>
            </div>
          </div>
        </div>

        <div v-if="isAddReferenceMode" class="add-reference-container">
          <div class="reference">
            <header class="reference-header">
              <h4>Reference {{ references.length + 1 }}</h4>
              <trash-icon class="trash-icon" @click="toggleAddReferenceMode" />
            </header>
            <div class="reference-name-container">
              <div>
                <label for="reference-first-name">First name</label>
                <input
                  type="text"
                  id="reference-first-name"
                  v-model="newReferenceFirstName"
                  required
                />
              </div>
              <div>
                <label for="reference-last-name">Last name</label>
                <input
                  type="text"
                  id="reference-last-name"
                  v-model="newReferenceLastName"
                  required
                />
              </div>
            </div>
            <label for="reference-email">Email</label>
            <input
              type="email"
              id="reference-email"
              v-model="newReferenceEmail"
              required
            />

            <p v-if="addReferenceError" class="error">
              {{ addReferenceError }}
            </p>

            <large-button
              class="btn save-btn"
              @click.native="addReference"
              :disabled="
                !(
                  newReferenceFirstName &&
                  newReferenceLastName &&
                  newReferenceEmail
                )
              "
              >Save</large-button
            >
          </div>
        </div>

        <button
          class="add-reference-btn"
          @click="toggleAddReferenceMode"
          v-if="!isAddReferenceMode && references.length < 2"
        >
          Add reference
        </button>
      </div>

      <separator v-if="!mobileMode" />

      <div class="buttons-container">
        <large-button class="btn done-btn" @click.native="closeModal"
          >Done</large-button
        >
      </div>
    </div>
  </modal>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import NetworkService from "@/services/NetworkService";
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";
import LargeButton from "@/components/LargeButton";
import validator from "validator";
import TrashIcon from "@/assets/trash.svg";
import CrossIcon from "@/assets/cross.svg";

export default {
  name: "reference-modal",
  components: { Modal, Separator, LargeButton, TrashIcon, CrossIcon },
  props: {
    closeModal: { type: Function, required: true }
  },
  data() {
    return {
      addReferenceError: "",
      references: [],
      newReferenceFirstName: "",
      newReferenceLastName: "",
      newReferenceEmail: "",
      isAddReferenceMode: false
    };
  },
  mounted() {
    this.references = this.user.references.slice();
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({ mobileMode: "app/mobileMode" })
  },
  methods: {
    toggleAddReferenceMode() {
      this.newReferenceFirstName = "";
      this.newReferenceLastName = "";
      this.newReferenceEmail = "";
      this.isAddReferenceMode = !this.isAddReferenceMode;
    },
    addReference() {
      if (
        !this.newReferenceFirstName ||
        !this.newReferenceLastName ||
        !this.newReferenceEmail
      ) {
        this.addReferenceError = "Please fill out all fields.";
        return;
      }
      if (!validator.isEmail(this.newReferenceEmail)) {
        this.addReferenceError = "Please enter a valid email address.";
        return;
      }

      if (!this.isUniqueEmail(this.newReferenceEmail)) {
        this.addReferenceError =
          "Looks like you've used this reference already.";
        return;
      }

      if (this.user.email === this.newReferenceEmail) {
        this.addReferenceError =
          "Your reference cannot have the same email address as you.";
        return;
      }

      this.addReferenceError = "";

      const newReference = {
        firstName: this.newReferenceFirstName,
        lastName: this.newReferenceLastName,
        email: this.newReferenceEmail,
        status: "UNSENT"
      };
      this.references.push(newReference);
      NetworkService.addReference({
        referenceFirstName: this.newReferenceFirstName,
        referenceLastName: this.newReferenceLastName,
        referenceEmail: this.newReferenceEmail
      });
      this.toggleAddReferenceMode();
      this.$store.dispatch("user/addToUser", {
        references: this.references
      });
    },
    removeReference(position) {
      NetworkService.deleteReference({
        referenceEmail: this.references[position].email
      });
      this.references = this.references.filter(
        (_, index) => position !== index
      );
      this.$store.dispatch("user/addToUser", {
        references: this.references
      });
    },
    isUniqueEmail(email) {
      let isUnique = true;
      for (const reference of this.references) {
        if (reference.email === email) {
          isUnique = false;
          break;
        }
      }
      return isUnique;
    }
  }
};
</script>

<style lang="scss" scoped>
$border-radius: 5px;

h1,
h2,
p {
  margin: 0;
  padding: 0;
}

header {
  @include flex-container(row, space-between, center);
  margin-bottom: 2em;
}

input {
  display: block;
  border-radius: $border-radius;
  border: 1px solid $c-border-grey;
  width: 100%;
  padding: 0.4em 0 0.4em 0.6em;

  &::placeholder {
    color: $c-secondary-grey;
  }
}

label {
  @include font-category("body");
  margin: 0.6em 0;
}

.reference-modal {
  text-align: left;
}

.title {
  @include font-category("display-small");
  @include child-spacing(bottom, 18px);
}

.subtitle {
  @include font-category("body");
  font-weight: 500;
}

.btn {
  margin-top: 20px;
}

.skip-btn,
.save-btn {
  margin-left: auto;
}

.done-btn {
  background-color: $c-success-green;
  border-color: transparent;
  color: white;
  border: none;
}

.references-container,
.add-reference-container {
  margin-top: 2em;
}

.references-list {
  list-style-type: none;
  padding-left: 0;
}

.buttons-container {
  @include flex-container(row, flex-end);
}

.trash-icon {
  fill: $c-soft-black;
  width: 25px;

  &:hover {
    cursor: pointer;
  }
}

.reference {
  @include font-category("body");
  border-radius: $border-radius;
  padding: 1em;
  box-shadow: 0px 0px 5px 0px rgba(166, 166, 166, 0.77);
  margin-bottom: 2em;

  &-name {
    font-weight: 500;
  }
}

.reference-header {
  @include flex-container(row, space-between, center);
  color: $c-secondary-grey;
  @include font-category("body");
}

.reference-name-container {
  @include flex-container(row, space-between);
}

.reference-status {
  @include flex-container(row, flex-start, center);
  margin-top: 0.8em;
  text-transform: uppercase;
  color: $c-secondary-grey;

  &-indicator {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-right: 0.6em;
  }
}

.approved {
  background-color: $c-success-green;
}

.pending {
  background-color: $c-warning-orange;
}

.rejected {
  background-color: $c-error-red;
}

.add-reference-btn {
  @include font-category("body");
  width: 160px;
  padding: 0.6em 0;
  background-color: $c-information-blue;
  color: white;
  border-radius: 30px;
  border: none;
  display: block;
  margin: 1.4em auto;
}

.seperator {
  border: 1px solid $c-border-grey;
  width: 100%;
  height: 1px;
  margin-top: 2em;
}

.cross-icon {
  width: 20px;
  cursor: pointer;

  &:hover {
    cursor: pointer;
  }
}

.error {
  color: $c-error-red;
  margin: 1em 0;
}
</style>
