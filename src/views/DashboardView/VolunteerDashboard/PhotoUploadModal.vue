<template>
  <div>
    <header>
      <h1 class="title">Proof of identity</h1>
      <cross-icon class="modal-close-icon" @click="closeModal" />
    </header>
    <p class="subtitle">
      Upload a picture of your photo ID so we can verify that it's you. This may
      be a driver's license, passport, or student ID.
    </p>

    <div v-if="photo" class="photo-id-container">
      <img :src="photo" class="photo-id-img" />
      <div class="trash-icon-container" @click="removePhoto">
        <trash-icon class="trash-icon" />
      </div>
    </div>
    <label v-else class="photo-id-label">
      <input type="file" class="photo-id-input" @change="submitPhoto" />
      <button class="upload-photo-btn">Upload Photo</button>
    </label>

    <div v-if="!mobileMode" class="modal-separator" />

    <large-button @click="submitPhoto" class="save-btn" :disabled="!photo">
      Save
    </large-button>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import LargeButton from "@/components/LargeButton";
import TrashIcon from "@/assets/trash.svg";
import CrossIcon from "@/assets/cross.svg";

export default {
  name: "volunteer-dashboard",
  components: { LargeButton, TrashIcon, CrossIcon },
  props: {
    closeModal: { type: Function, required: true }
  },
  data() {
    return {
      photo: ""
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
    // @todo: server side - add photo url to user
    submitPhoto(event) {
      const { files } = event.target;
      const file = files[0];
      this.photo = URL.createObjectURL(file);
    },
    removePhoto() {
      event.stopPropagation();
      this.photo = "";
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

.save-btn {
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
  width: 100%;
  border-radius: 5px;
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
