<template>
  <modal :closeModal="closeModal">
    <div>
      <header>
        <h1 class="title">Proof of identity</h1>
        <cross-icon class="upc-modal-close-icon" @click="closeModal" />
      </header>
      <div v-if="user.photoIdStatus === 'SUBMITTED'">
        <p class="subtitle">
          Your photo ID is under review.
        </p>
      </div>
      <div v-else>
        <p class="subtitle">
          Upload a picture of a valid photo ID (such as your driver's license,
          passport, or student ID) so we can verify your identity.
        </p>

        <div v-if="photo" class="photo-id-container">
          <img :src="photo" class="photo-id-img" />
          <div class="trash-icon-container" @click="removePhoto">
            <trash-icon class="trash-icon" />
          </div>
        </div>
        <label v-else class="photo-id-label">
          <input
            type="file"
            accept="image/png, image/jpeg"
            class="photo-id-input"
            @change="addPhoto"
          />
          <button class="upload-photo-btn">Upload Photo</button>
        </label>
        <p v-if="error" class="error">{{ error }}</p>

        <separator v-if="!mobileMode" />

        <large-button
          @click.native="submitPhoto"
          class="submit-btn"
          :disabled="!photo"
        >
          Submit
        </large-button>
      </div>
    </div>
  </modal>
</template>

<script>
import axios from "axios";
import NetworkService from "@/services/NetworkService";
import { mapState, mapGetters } from "vuex";
import Modal from "@/components/Modal";
import Separator from "@/components/Separator";
import LargeButton from "@/components/LargeButton";
import TrashIcon from "@/assets/trash.svg";
import CrossIcon from "@/assets/cross.svg";

export default {
  name: "volunteer-dashboard",
  components: { Modal, Separator, LargeButton, TrashIcon, CrossIcon },
  props: {
    closeModal: { type: Function, required: true }
  },
  data() {
    return {
      photo: "",
      file: undefined,
      error: ""
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({ mobileMode: "app/mobileMode" })
  },
  methods: {
    addPhoto(event) {
      const { files } = event.target;
      const file = files[0];
      const twentyFiveMegaBytes = 25 * 1000000;
      if (file.size > twentyFiveMegaBytes) {
        this.error =
          "This photo is too large. Please upload a photo less than 25mb.";
        return;
      }
      this.error = "";
      this.file = file;
      this.photo = URL.createObjectURL(file);
    },
    removePhoto() {
      event.stopPropagation();
      this.photo = "";
    },
    submitPhoto() {
      if (!this.photo) {
        this.error = "Please upload a photo before submitting.";
        return;
      }
      this.error = "";
      NetworkService.getPhotoUploadUrl().then(res => {
        const { uploadUrl } = res.body;
        if (uploadUrl) {
          axios.put(uploadUrl, this.file, {
            headers: {
              "Content-Type": this.file.type
            }
          });
          this.$store.dispatch("user/addToUser", {
            photoIdStatus: "SUBMITTED"
          });
          this.closeModal();
        } else {
          this.error = "Sorry, we had trouble uploading your photo.";
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
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

.title {
  @include font-category("display-small");
  @include child-spacing(bottom, 18px);
  text-align: left;
}

.subtitle {
  @include font-category("body");
  text-align: left;
  color: $c-secondary-grey;
}

.submit-btn {
  background-color: $c-success-green;
  border-color: transparent;
  color: white;
  margin-left: auto;
  margin-top: 20px;
  border: none;
}

.photo-id-container {
  position: relative;
  margin: 2em 0;
}

.photo-id-img {
  max-width: 100%;
  max-height: 300px;
}

.photo-id-label {
  @include flex-container(row, center, center);
  border-radius: 8px;
  margin: 2em 0;
  border: 3px dashed $c-border-grey;
  cursor: pointer;

  &:hover {
    background-color: rgba($color: $c-border-grey, $alpha: 0.2);

    & button {
      background-color: rgba($color: $c-information-blue, $alpha: 0.7);
    }
  }
}

.photo-id-input {
  display: none;
  width: 0;
}

.upload-photo-btn {
  width: 160px;
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  color: white;
  background-color: $c-information-blue;
  padding: 1.4em 1em;
  pointer-events: none;
  margin: 4em 0;
}

.trash-icon-container {
  @include flex-container(row, center, center);
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  padding: 0.5em;
  border-radius: 40px;
  background-color: rgba($color: $c-soft-black, $alpha: 0.8);
  cursor: pointer;
}

.trash-icon {
  fill: white;
}

.seperator {
  border: 1px solid $c-border-grey;
  width: 100%;
  height: 1px;
  margin-top: 2em;
}

.error {
  color: $c-error-red;
  text-align: left;
  margin-bottom: 1em;
}
</style>
