<template>
  <modal>
    <div class="reference-modal">
      <header>
        <h1 class="title">Reference check</h1>
        <cross-icon class="modal-close-icon" @click="closeModal" />
      </header>
      <div v-if="step === 0">
        <p class="subtitle">
          Step 1: Add your LinkedIn (optional)
        </p>
        <p>
          Adding your LinkedIn allows us to quickly verify your credentials and
          require 1 less reference from you!
        </p>
        <input
          type="text"
          pattern=".*linkedin\.com.*\/in\/.*"
          v-model="linkedInUrl"
          placeholder="linkedin.com/in/example"
          class="linkedin-input"
        />
      </div>
      <div v-else-if="step === 1">
        <p class="subtitle">
          Step 2: Provide {{ totalReferencesNeeded }} reference{{
            totalReferencesNeeded === 1 ? "" : "s"
          }}
        </p>
        <p>
          Please provide the name and email for your references. We will contact
          them via email requesting them to fill out a reference form
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
            <p>{{ reference.name }}</p>
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
            <label for="reference-name">Name</label>
            <input type="text" id="reference-name" v-model="newReferenceName" />
            <label for="reference-email">Email</label>
            <input
              type="email"
              id="reference-email"
              v-model="newReferenceEmail"
            />
            <large-button
              class="btn save-btn"
              @click.native="addReference"
              :disabled="!(newReferenceName && newReferenceEmail)"
              >Save</large-button
            >
          </div>
        </div>

        <button
          class="add-reference-btn"
          @click="toggleAddReferenceMode"
          v-if="
            !isAddReferenceMode && references.length < totalReferencesNeeded
          "
        >
          Add reference
        </button>
      </div>

      <separator v-if="!mobileMode" />

      <div class="buttons-container">
        <large-button class="btn" @click.native="previousStep" v-if="step === 1"
          >Back</large-button
        >

        <large-button
          class="btn skip-btn"
          @click.native="nextStep"
          v-if="step === 0 && !linkedInUrl"
          >Skip</large-button
        >
        <large-button
          class="btn skip-btn"
          @click.native="addLinkedIn"
          v-if="step === 0 && linkedInUrl"
          >Next</large-button
        >

        <large-button
          class="btn done-btn"
          v-if="step === 1"
          @click.native="closeModal"
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
      linkedInUrl: "",
      references: [],
      newReferenceName: "",
      newReferenceEmail: "",
      step: 0,
      isAddReferenceMode: false
    };
  },
  mounted() {
    // @todo: use vuex
    // (rn if you add a reference then close + open the modal, it's gone)
    this.references = this.user.references.slice();
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({ mobileMode: "app/mobileMode" }),
    totalReferencesNeeded() {
      return this.linkedInUrl ? 1 : 2;
    },
    stepOneButtonText() {
      return this.linkedInUrl ? "Next" : "Skip";
    }
  },
  methods: {
    nextStep() {
      this.step += 1;
    },
    previousStep() {
      this.step -= 1;
    },
    toggleAddReferenceMode() {
      this.newReferenceName = "";
      this.newReferenceEmail = "";
      this.isAddReferenceMode = !this.isAddReferenceMode;
    },
    // @todo: use vuex
    // (rn if you add a reference then close + open the modal, it's gone)
    addReference() {
      const newReference = {
        name: this.newReferenceName,
        email: this.newReferenceEmail,
        status: "UNSENT"
      };
      this.references.push(newReference);
      NetworkService.addReference({
        referenceName: this.newReferenceName,
        referenceEmail: this.newReferenceEmail
      });
      this.toggleAddReferenceMode();
    },
    removeReference(position) {
      NetworkService.deleteReference({
        referenceEmail: this.references[position].email
      });
      this.references = this.references.filter(
        (_, index) => position !== index
      );
    },
    addLinkedIn() {
      NetworkService.addLinkedIn({ linkedInUrl: this.linkedInUrl });
      this.nextStep();
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

.linkedin-input {
  margin: 1.4em 0;

  &:invalid {
    outline-color: $c-error-red;
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
  @include flex-container(row, space-between, center);
}

.trash-icon {
  fill: $c-soft-black;
  width: 25px;
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
}
</style>
