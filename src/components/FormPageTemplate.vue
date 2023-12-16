<template>
  <div
    class="h-full"
    :class="{ 'uc-row': showNewDesign, 'uc-column': !showNewDesign }"
  >
    <div v-if="!showNewDesign" class="background-img"></div>
    <div v-else class="bg-fixed-container">
      <div class="bg-fixed  uc-column items-center justify-end">
        <h1 class="header">
          Chat with an online college coach for free!
        </h1>
        <div class="image-container">
          <chat-mobile class="w-full h-full" />
        </div>
      </div>
    </div>
    <div
      :class="{
        'bg-content uc-column items-center justify-center': showNewDesign,
        FormPageTemplate: !showNewDesign,
      }"
    >
      <img
        v-if="!showNewDesign"
        class="logo-white"
        src="@/assets/p_logo_white.png"
        alt="UPchieve"
      />
      <img
        :class="{
          'logo-teal-new-design': showNewDesign,
          'logo-teal': !showNewDesign,
        }"
        src="@/assets/header_logo.png"
        alt="UPchieve"
      />
      <slot></slot>
      <img
        v-if="showNewDesign"
        class="img-updog-subjects"
        src="@/assets/updog-subjects.png"
      />
    </div>
    <nav class="footer" aria-label="More information">
      <div>
        <router-link to="/contact">Contact Us</router-link>
      </div>
      <div>
        <router-link to="/legal" target="_blank">Legal Policy</router-link>
      </div>
      <div>
        <a href="https://upchieve.org/" target="_blank">Our Website</a>
      </div>
    </nav>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import ChatMobile from '@/assets/chat-mobile.svg'

export default {
  components: {
    ChatMobile,
  },
  computed: {
    ...mapGetters({
      isNewEligibilityFormDesignEnabled:
        'featureFlags/isNewEligibilityFormDesignEnabled',
    }),
    showNewDesign() {
      return (
        this.isNewEligibilityFormDesignEnabled &&
        this.$route.path.includes('eligibility') &&
        this.$route.query['partner'] === 'bigfuture'
      )
    },
  },
}
</script>

<style lang="scss" scoped>
.bg-fixed-container {
  flex: 1 1 0;
  height: 100%;

  @include breakpoint-below('tiny') {
    display: none;
  }
}

.bg-fixed {
  background-color: #f0f9ff;
  height: 100%;
  position: fixed;
  width: 50%;
}

.header {
  font-size: 32px;
  font-weight: 600;
  max-width: 65%;
  min-width: 300px;
  padding: 16px 24px;
  text-align: center;
}

.image-container {
  height: 100%;
  max-height: 70vh;
  width: 100%;
}

.bg-content {
  background-color: white;
  flex: 1 1 0;
  margin: auto;
  min-height: 100vh;
  padding-bottom: 50px;

  .uc-form::v-deep {
    padding-top: 0px;

    @include breakpoint-below('tiny') {
      padding-bottom: 0px;
    }
  }

  @include breakpoint-below('tiny') {
    padding-bottom: 100px;
  }
}

.logo-teal-new-design {
  margin: 16px;
}

.img-updog-subjects {
  margin-top: 10px;
  @include breakpoint-above('tiny') {
    display: none;
  }
}

/* old */
.background-img {
  background-color: white;

  @include breakpoint-above('tiny') {
    background: url('~@/assets/onboarding_background.png') no-repeat center
      center;
    background-attachment: fixed;
    background-size: cover;
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;
    z-index: -1;
  }
}

.FormPageTemplate {
  @include flex-container(column, flex-start, center);
  padding-top: 20px;

  padding-bottom: 50px;

  @include breakpoint-below('tiny') {
    background-color: white;
  }
}

.logo-white {
  max-width: 155px;
  margin-bottom: 20px;
  margin-top: 20px;
  display: none;

  @include breakpoint-above('tiny') {
    display: block;
  }
}

.logo-teal {
  display: block;
  max-width: 95px;
  padding-top: 12px;

  @include breakpoint-above('tiny') {
    display: none;
  }
}

.footer {
  @include flex-container(column, space-around, center);

  background-color: #f6f6f6;
  border-top: 1px solid #cccccf;

  font-size: 12px;
  font-weight: 600;

  min-height: 100px;
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

  @include breakpoint-above('tiny') {
    flex-direction: row;
    min-height: 50px;
  }
}
</style>
