<template>
  <div class="base">
    <div
      :class="{
        'form-card': layout === 'card',
        'form-panel left w-50p': layout === 'panel-left-50p',
        'form-panel left w-75p': layout === 'panel-left-75p',
        'form-panel right w-50p': layout === 'panel-right-50p',
        'form-panel right w-75p': layout === 'panel-right-75p',
        full: layout === 'full',
      }"
      :style="{
        maxWidth: layout === 'card' && formCardMaxWidth ? formCardMaxWidth : '',
      }"
    >
      <div v-if="layout.includes('panel')" class="img-content">
        <picture v-if="panelImageUrl">
          <source
            :srcset="panelImageUrl.preferred.url"
            :type="panelImageUrl.preferred.type"
          />
          <img
            :src="panelImageUrl.fallback.url"
            class="img"
            :style="customPanelImgStyle"
          />
        </picture>
        <div v-if="imageText" class="img-text">
          <h1>{{ imageText }}</h1>
        </div>
      </div>
      <div class="form-content">
        <img
          v-if="!hideLogo"
          class="logo teal"
          src="@/assets/logos/header-logo-teal.svg?url"
          aria-hidden
        />
        <slot></slot>
      </div>
    </div>
    <img
      class="logo white"
      src="@/assets/logos/header-logo-teal.svg?url"
      aria-hidden
    />

    <nav class="footer" aria-label="More information">
      <div>
        <router-link to="/contact">Contact Us</router-link>
      </div>
      <div>
        <a href="https://upchieve.org/legal" target="_blank">Legal Policy</a>
      </div>
      <div>
        <a href="https://upchieve.org/" target="_blank">Our Website</a>
      </div>
    </nav>
  </div>
</template>

<script>
import ChatOneOnOneFallback from '@/assets/marketing_images/chat-1-on-1.png?url'
import ChatOneOnOnePreferred from '@/assets/marketing_images/chat-1-on-1.avif?url'
import ConnectYourStudentsFallback from '@/assets/marketing_images/connect-your-students.png?url'
import ConnectYourStudentsPreferred from '@/assets/marketing_images/connect-your-students.avif?url'
import TrustedByStudentsPreferred from '@/assets/marketing_images/trusted_by_students.avif?url'
import TrustedByStudentsFallback from '@/assets/marketing_images/trusted_by_students.png?url'
import UpdogSubjects from '@/assets/updog-subjects.png?url'
import WeCanHelpSubjectsPreferred from '@/assets/marketing_images/we_can_help_in_any_core_subject.avif?url'
import WeCanHelpSubjectsFallback from '@/assets/marketing_images/we_can_help_in_any_core_subject.png?url'
import UpdogCrying from '@/assets/updog-crying.svg?url'
import VolunteerSignUpIllustrationPreferred from '@/assets/volunteer-signup-illustration.avif?url'
import VolunteerSignUpIllustrationFallback from '@/assets/volunteer-signup-illustration.png?url'

export default {
  props: {
    layout: {
      type: String,
      default: 'card',
    },
    panelImg: {
      type: String,
    },
    hideLogo: {
      default: false,
    },
    formCardMaxWidth: {
      type: String,
      default: null,
    },
    imageText: {
      type: String,
      default: null,
    },
  },
  computed: {
    customPanelImgStyle() {
      if (this.panelImg === 'chat-one-on-one') {
        return {
          'padding-left': '0px',
          'object-fit': 'contain',
          'max-height': 'calc(100vh - 50px)',
        }
      }

      if (this.panelImg === 'we-can-help-subjects') {
        return {
          padding: '45px',
          'object-fit': 'contain',
          'max-height': 'calc(100vh - 50px)',
        }
      }

      if (this.panelImg === 'updog-crying') {
        return {
          height: 'auto',
          'max-width': '80%',
          padding: '45px',
        }
      }

      if (this.panelImg === 'updog-subjects') {
        return {
          'padding-top': '0',
          'object-fit': 'contain',
          'max-height': 'calc(100vh - 50px)',
        }
      }

      if (this.panelImg === 'trusted-by-students') {
        return {
          'object-fit': 'contain',
          'max-height': 'calc(100vh - 50px)',
        }
      }
      if (this.panelImg === 'connect-your-students') {
        return {
          'object-fit': 'contain',
          'max-height': 'calc(100vh - 50px)',
        }
      }

      if (this.panelImg === 'volunteer-signup-illustration') {
        return {
          'object-fit': 'contain',
        }
      }
      return {}
    },

    panelImageUrl() {
      const imageMap = {
        'chat-one-on-one': {
          preferred: { url: ChatOneOnOnePreferred, type: 'image/avif' },
          fallback: { url: ChatOneOnOneFallback, type: 'image/png' },
        },
        'connect-your-students': {
          preferred: { url: ConnectYourStudentsPreferred, type: 'image/avif' },
          fallback: { url: ConnectYourStudentsFallback, type: 'image/png' },
        },
        'trusted-by-students': {
          preferred: { url: TrustedByStudentsPreferred, type: 'image/avif' },
          fallback: { url: TrustedByStudentsFallback, type: 'image/png' },
        },
        'updog-subjects': {
          preferred: { url: UpdogSubjects, type: 'image/png' },
          fallback: { url: UpdogSubjects, type: 'image/png' },
        },
        'we-can-help-subjects': {
          preferred: { url: WeCanHelpSubjectsPreferred, type: 'image/avif' },
          fallback: { url: WeCanHelpSubjectsFallback, type: 'image/png' },
        },
        'updog-crying': {
          preferred: { url: UpdogCrying, type: 'image/svg' },
          fallback: { url: UpdogCrying, type: 'image/svg' },
        },
        'volunteer-signup-illustration': {
          preferred: {
            url: VolunteerSignUpIllustrationPreferred,
            type: 'image/avif',
          },
          fallback: {
            url: VolunteerSignUpIllustrationFallback,
            type: 'image/png',
          },
        },
      }
      return imageMap[this.panelImg] || null
    },
  },
}
</script>

<style lang="scss" scoped>
$footer-height: 50px;
$footer-height-tiny: 100px;

.base {
  @include flex-container(column, center, center);
  background-attachment: fixed;
  background-color: white;
  background-image: url('@/assets/onboarding_background.png');
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  min-height: 100%;
  padding-bottom: $footer-height;

  @include breakpoint-below('tiny') {
    background-image: none;
    padding-bottom: $footer-height-tiny;

    &:has(.form-card) {
      justify-content: start;
    }
  }

  &:has(.full, .w-50p) {
    background-image: none;
  }

  .form-card {
    background: white;
    border-radius: 22px;
    max-width: 500px;
    padding: 25px;
    position: relative;
    width: 95%;
  }

  .form-panel {
    @include flex-container(row, space-between, stretch);
    width: 100%;

    .form-content {
      @include flex-container(column);
    }

    .img-content,
    .form-content {
      min-height: calc(100vh - $footer-height);

      @include breakpoint-below('tiny') {
        min-height: calc(100vh - $footer-height-tiny);
      }
    }

    &.left {
      flex-direction: row-reverse;
    }

    &.right {
      flex-direction: row;
    }

    &.w-50p {
      .form-content {
        background: white;
        flex: 1;
        padding: 2rem;

        @include breakpoint-below('small') {
          padding: 16px;
        }
      }

      .img-content {
        background-color: #f0f9ff;
        flex: 1;

        @include breakpoint-below('medium') {
          display: none;
        }
      }
    }

    &.w-75p {
      .form-content {
        background: white;
        flex: 4;
        padding: 2rem;

        @include breakpoint-below('small') {
          flex: 1;
          padding: 16px;
        }
      }

      .img-content {
        flex: 1;

        @include breakpoint-below('small') {
          display: none;
        }
      }
    }
  }
}

.form-card + .logo.white {
  display: block;

  @include breakpoint-below('tiny') {
    display: none;
  }
}

.form-card .logo.teal {
  display: none;

  @include breakpoint-below('tiny') {
    display: block;
  }
}

.form-panel + .logo.white {
  display: none;
}

.full + .logo.white {
  display: none;
}

.full .logo.teal {
  display: none;
}

.logo {
  &.white {
    width: 155px;
    order: -1;
    padding-bottom: 18px;
    // make the image white
    filter: brightness(0) invert(1);
  }

  &.teal {
    margin-bottom: 16px;
    max-width: 95px;
  }
}

.img-content {
  @include flex-container(column, center, center);
}

.img {
  height: calc(100vh - $footer-height);
  max-width: 1000px;
  padding: 25px 25px 0 25px;
  width: 100%;
}

.img-text {
  text-align: center;
  padding: 25px 25px 0 25px;

  h1 {
    font-size: 32px;
  }
}

.footer {
  @include flex-container(row, space-around, center);

  background-color: #f6f6f6;
  border-top: 1px solid #cccccf;

  font-size: 12px;
  font-weight: 600;

  min-height: $footer-height;
  margin-top: auto;
  width: 100%;

  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;

  a {
    color: #73737a;
    text-transform: uppercase;
  }

  @include breakpoint-below('tiny') {
    flex-direction: column;
    min-height: $footer-height-tiny;
  }
}
</style>
