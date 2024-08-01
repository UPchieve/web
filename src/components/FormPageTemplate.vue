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
    >
      <div v-if="layout.includes('panel')" class="img-content">
        <component v-if="panelImg" :is="panelImg" class="img" />
      </div>
      <div class="form-content">
        <img
          v-if="!hideLogo"
          class="logo teal"
          src="@/assets/header_logo.png"
          aria-hidden
        />
        <slot></slot>
      </div>
    </div>
    <img class="logo white" src="@/assets/p_logo_white.png" aria-hidden />

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
import ChatOneOnOne from '@/assets/chat-1-on-1.svg'
import EmpowerYourStudents from '@/assets/empower-your-students.svg'
import UpdogSubjects from '@/assets/updog-subjects.svg'
export default {
  components: {
    ChatOneOnOne,
    EmpowerYourStudents,
    UpdogSubjects,
  },
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
  height: 100%;
  padding-top: 25px;
  width: 100%;
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
