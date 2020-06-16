<template>
  <modal :closeModal="closeModal">
    <div>
      <header>
        <h1 class="title">Proof of identity</h1>
        <cross-icon class="modal-close-icon" @click="closeModal" />
      </header>
      <div v-if="user.photoIdStatus === 'SUBMITTED'">
        <p class="subtitle">
          Your ID photo is in review
        </p>
      </div>
      <div v-else>
        <p class="subtitle">
          Upload a picture of your photo ID so we can verify that it's you. This
          may be a driver's license, passport, or student ID.
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
      file: undefined
    };
  },
  mounted() {
    this.photo = this.user.photo;
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
      this.file = file;
      this.photo = URL.createObjectURL(file);
    },
    removePhoto() {
      event.stopPropagation();
      this.photo = "";
    },
    submitPhoto() {
      // @todo: error handling
      NetworkService.getPhotoUploadUrl().then(res => {
        const { uploadUrl } = res.body;
        axios.put(uploadUrl, this.file, {
          "Content-Type": this.file.type
        });
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
</style>
