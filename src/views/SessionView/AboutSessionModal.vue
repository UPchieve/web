<template>
  <modal :closeModal="closeModal" class="about-session-modal-wrapper">
    <div class="about-session-modal">
      <div class="header-info">
        <cross-icon class="cross-icon" @click="closeModal" />
        <div class="header">About the session</div>
        <div v-if="isNewStudent" class="alert-container">
          <div class="alert">
            <alert-icon class="alert-icon" />
            <div class="subheading">{{ totalSessionsTextTitle }}</div>
          </div>
          <div class="subtitle">
            Be sure to be welcoming and extra patient as they get used to our
            platform.
          </div>
        </div>
      </div>
      <div class="session-info">
        <div class="session-info-stepper-container">
          <stepper :totalSteps="3" class="session-info-stepper" />
          <div class="session-info-responses">
            <div v-for="response in responses" :key="response.displayLabel">
              <div class="session-info-title">{{ response.displayLabel }}</div>
              <div class="session-info-response">
                <span v-if="response.displayImage">
                  <img class="response-image" :src="response.displayImage" />
                  {{ response.response.toLowerCase() }}
                </span>
                <span v-else>{{ response.response }}</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="!isNewStudent && hasLowConfidence" class="tip">
          <div class="tip-title">UPchieve's tip</div>
          <div class="tip-text">
            {{ studentsFirstName }} is feeling {{ studentsConfidence }}. Praise
            their effort and start with easy questions so that they can
            experience small wins!
          </div>
        </div>
      </div>
    </div>
  </modal>
</template>

<script>
import Modal from '@/components/Modal'
import Stepper from '@/components/Stepper'
import AlertIcon from '@/assets/blue-alert.svg'
import CrossIcon from '@/assets/cross.svg'
import { mapState } from 'vuex'

export default {
  name: 'about-session-modal',
  components: { Modal, Stepper, AlertIcon, CrossIcon },
  props: {
    closeModal: { type: Function, required: true },
    responses: { type: Array, requied: true },
    totalStudentSessions: { type: Number, requied: true },
  },
  computed: {
    ...mapState({
      session: state => state.user.session,
    }),
    isNewStudent() {
      return this.totalStudentSessions < 3
    },
    totalSessionsTextTitle() {
      let display = ''
      if (this.totalStudentSessions === 1) display = 'first'
      if (this.totalStudentSessions === 2) display = 'second'

      return `This is ${this.studentsFirstName}'s ${display} session!`
    },
    hasLowConfidence() {
      for (const response of this.responses) {
        if (response.displayImage && response.score <= 2) return true
      }
      return false
    },
    studentsFirstName() {
      return this.session.student.firstname
    },
    studentsConfidence() {
      for (const response of this.responses) {
        if (response.displayImage && response.score <= 2)
          return response.response.toLowerCase()
      }
      return ''
    },
  },
}
</script>

<style lang="scss">
.about-session-modal-wrapper .upc-modal-form {
  @include flex-container(column);
  border-radius: 22px;
  padding: 0;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
}

.about-session-modal-wrapper .upc-modal-form--bottom-padding {
  padding: 0;
}

.about-session-modal .stepper,
.step {
  flex-direction: column;
}

.about-session-modal .step {
  flex-direction: column;
}

.about-session-modal .step-display {
  color: $step-blue;
}

.about-session-modal .circle {
  border: 1px solid $step-blue;
}

.about-session-modal .progress-bar {
  background-color: $step-blue;
  height: 41px;
  width: 1px;
}

.session-info-stepper-container .response-image {
  width: 20px;
}
</style>

<style lang="scss" scoped>
.about-session-modal {
  text-align: left;
}

.header-info {
  padding: 2em 2.5em 2em 2em;
}

.header {
  @include font-category('display-small');
}

.subheading {
  @include font-category('subheading');
}

.subtitle {
  font-size: 12px;
  font-weight: 400;
  margin-top: 0.8em;
}

.session-info {
  background-color: #f7fbfe;
  padding: 2em 3.5em 3.5em 3.5em;

  &-stepper-container {
    @include flex-container(row);
  }

  &-responses {
    @include flex-container(column, space-between, normal);
    margin-left: 1em;
  }

  &-title {
    @include font-category('helper-text');
    color: #565961;

    @include breakpoint-below('small') {
      font-size: 12px;
    }
  }

  &-response {
    @include font-category('subheading');

    @include breakpoint-below('small') {
      font-size: 14px;
    }
  }
}

.alert {
  @include flex-container(row, normal, center);
  padding: 0;
  margin-top: 1.25em;

  &-icon {
    height: 14.25px;
    width: 14px;
    margin-right: 0.5em;
  }
}

.cross-icon {
  height: 10px;
  width: 10px;
  margin-left: 100%;
  vertical-align: top;

  &:hover {
    cursor: pointer;
  }
}

.tip {
  background-color: $c-background-blue;
  font-size: 12px;
  margin-top: 1.4em;
  padding: 1.4em;

  &-title {
    color: $c-information-blue;
    font-weight: 600;
  }

  &-text {
    font-weight: $font-weight-regular;
  }
}
</style>
