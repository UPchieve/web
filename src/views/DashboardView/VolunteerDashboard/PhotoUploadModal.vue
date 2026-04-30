<template>
  <modal :closeModal="closeModal">
    <div data-testid="photo-upload-modal">
      <header>
        <h1 class="title">Proof of identity</h1>
        <cross-icon
          class="upc-modal-close-icon"
          @click="closeModal"
          data-testid="close-modal-btn"
        />
      </header>
      <div class="content" v-if="user.photoIdStatus === 'APPROVED'">
        Your photo ID has been verified by the UPchieve team!
      </div>
      <div
        class="content"
        v-else-if="user.photoIdStatus === 'SUBMITTED'"
        data-testid="photo-submitted-content"
      >
        <p>
          We've received your photo ID. The UPchieve team will review your ID
          within 1-2 business days. Once reviewed, you'll be one step closer to
          helping our students!
        </p>
        <span data-testid="help-text"
          ><strong>Questions?</strong> Check out our
          <LinkComponent
            :url="photoIdFaqLink"
            text="photo ID FAQs"
            :showArrow="true"
        /></span>
      </div>
      <div v-else class="content">
        To ensure the safety of our students, we need to confirm your identity
        by reviewing a photo ID before you can begin tutoring:
        <ul>
          <li>
            Acceptable forms of ID include a driver's license, passport, or
            student ID
            <ul>
              <li>Selfies are <strong>not</strong> an acceptable form of ID</li>
            </ul>
          </li>
          <li>
            Your full name, photo, and school name (if uploading a student ID)
            must be clearly visible
          </li>
          <li>Acceptable image formats: jpeg, png</li>
        </ul>

        <span v-if="user.photoIdStatus !== 'REJECTED'" data-testid="help-text">
          <strong>Questions?</strong> Check out our
          <LinkComponent
            :url="photoIdFaqLink"
            text="photo ID FAQs"
            :showArrow="true"
        /></span>
        <span v-else data-testid="help-text">
          <strong class="warning">Your last photo ID was rejected.</strong>
          Check out our
          <LinkComponent
            :url="photoIdFaqLink"
            text="photo ID FAQs"
            :showArrow="true"
            color="blue"
          />
          for tips on choosing an acceptable form of ID.
        </span>

        <div v-if="photo" class="photo-id-container">
          <img
            :src="photo"
            class="photo-id-img"
            alt="your uploaded photo id"
            data-testid="uploaded-photo"
          />
          <div
            class="trash-icon-container"
            @click="removePhoto"
            data-testid="remove-photo-btn"
          >
            <trash-icon class="trash-icon" />
          </div>
        </div>
        <label v-else class="photo-id-label">
          <input
            type="file"
            accept="image/png, image/jpeg"
            class="photo-id-input"
            @change="addPhoto"
            data-testid="photo-upload-file-input"
          />
          <button
            class="upload-photo-btn"
            type="button"
            data-testid="upload-photo-btn"
          >
            Upload Photo ID
          </button>
        </label>
        <p v-if="error" class="error">{{ error }}</p>

        <large-button
          @click="submitPhoto"
          class="submit-btn"
          :disabled="!photo ? true : null"
          data-testid="submit-photo-btn"
        >
          Submit
        </large-button>
      </div>
    </div>
  </modal>
</template>

<script>
import axios from 'axios'
import NetworkService from '@/services/NetworkService'
import { mapState, mapGetters } from 'vuex'
import Modal from '@/components/Modal.vue'
import LargeButton from '@/components/LargeButton.vue'
import TrashIcon from '@/assets/trash.svg'
import CrossIcon from '@/assets/cross.svg'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'
import Link from '@/components/Link.vue'

export default {
  name: 'volunteer-dashboard',
  components: {
    LinkComponent: Link,
    Modal,
    LargeButton,
    TrashIcon,
    CrossIcon,
  },
  props: {
    closeModal: { type: Function, required: true },
  },
  data() {
    return {
      photo: '',
      file: undefined,
      error: '',
      photoIdFaqLink:
        'https://help.upchieve.org/en/articles/76-submitting-photo-id-to-volunteer-on-upchieve',
    }
  },
  mounted() {
    AnalyticsService.captureEvent(EVENTS.PHOTO_ID_MODAL_OPENED)
  },
  unmounted() {
    AnalyticsService.captureEvent(EVENTS.PHOTO_ID_MODAL_CLOSED)
  },
  computed: {
    ...mapState({
      user: (state) => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isStudentVolunteer: 'user/isStudentVolunteer',
    }),
  },
  methods: {
    async addPhoto(event) {
      const { files } = event.target
      const file = files[0]
      const twentyFiveMegaBytes = 25 * 1000000
      if (file.size > twentyFiveMegaBytes) {
        this.error =
          'This photo is too large. Please upload a photo less than 25mb.'
        return
      }

      this.error = ''
      this.file = file
      this.photo = URL.createObjectURL(file)
      AnalyticsService.captureEvent(EVENTS.PHOTO_ID_SELECTED)
    },
    removePhoto() {
      event.stopPropagation()
      this.photo = ''
      AnalyticsService.captureEvent(EVENTS.PHOTO_ID_REMOVED)
    },
    submitPhoto() {
      if (!this.photo) {
        this.error = 'Please upload a photo before submitting.'
        return
      }
      this.error = ''
      NetworkService.getPhotoUploadUrl().then((res) => {
        const { uploadUrl } = res.data
        if (uploadUrl) {
          axios.put(uploadUrl, this.file, {
            headers: {
              'Content-Type': this.file.type,
            },
          })
          this.$store.dispatch('user/addToUser', {
            photoIdStatus: 'SUBMITTED',
          })
          AnalyticsService.captureEvent(EVENTS.PHOTO_ID_ADDED, {
            event: EVENTS.PHOTO_ID_ADDED,
          })
          if (this.isStudentVolunteer)
            AnalyticsService.captureEvent(
              EVENTS.ROLE_SWITCHING_USER_UPLOADED_PHOTO_ID
            )
          this.closeModal()
        } else {
          this.error = 'Sorry, we had trouble uploading your photo.'
        }
      })
    },
  },
}
</script>

<style lang="scss" scoped>
.warning {
  color: $c-error-red;
}

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
  @include font-category('display-small');
  @include child-spacing(bottom, 18px);
  text-align: left;
}

.submit-btn {
  background-color: $c-success-green;
  color: white;
  margin-top: 20px;
  margin-left: auto;
  display: flex;
}

.photo-id-container {
  margin: 2em 0;
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 16px;

  .trash-icon-container {
    @include flex-container(row, center, center);
    top: 15px;
    right: 15px;
    width: 40px;
    height: 40px;
    padding: 0.5em;
    border-radius: 40px;
    background-color: rgba($color: $c-soft-black, $alpha: 0.8);
    cursor: pointer;

    .trash-icon {
      fill: white;
    }
  }
}

.photo-id-img {
  max-width: 100%;
  max-height: 300px;
}

.photo-id-label {
  @include flex-container(row, center, center);
  border-radius: 8px;
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
  border: 1px solid $c-border-grey;
  border-radius: 8px;
  color: white;
  background-color: $c-information-blue;
  padding: 1.4em 1em;
  pointer-events: none;
  margin: 4em 0;
}

.error {
  color: $c-error-red;
  text-align: left;
  margin-bottom: 1em;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
