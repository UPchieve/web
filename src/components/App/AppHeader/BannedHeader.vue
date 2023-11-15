<template>
  <div class="banned_header">
    <hamburger-button v-if="mobileMode" class="left white" :tabindex="0" />
    <div class="banned_header-text">{{ message }}</div>
    <div class="banned_header-document">
      <a :href="linkOut" target="_blank"> Why am I seeing this?</a>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { DOCS_URL } from '@/consts'
import HamburgerButton from './HamburgerButton.vue'

export default {
  name: 'banned-header',
  components: { HamburgerButton },
  computed: {
    ...mapState({
      user: state => state.user.user,
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
    }),
    linkOut() {
      return this.user.isVolunteer
        ? `${DOCS_URL}/coach-community-guidelines.pdf`
        : `${DOCS_URL}/Student-Community-Guidelines.pdf`
    },
    message() {
      return 'Your account is under review'
    },
  },
}
</script>

<style lang="scss" scoped>
.banned_header {
  @include header-child;
  @include font-category('display-small');
  color: white;

  display: grid;
  align-content: center;
  grid-template-columns: 1fr minmax(200px, 1fr) minmax(100px, 1fr);
  position: relative;
  background-color: $c-banned-grey;
}

.banned_header-text {
  font-weight: 600;
  grid-column: 2;
}

.banned_header-document {
  a {
    color: white;
    font-size: 16px;
  }
  grid-column: 3;
  justify-self: right;
  align-self: center;
}

.left {
  left: 15px;
  position: absolute;
  top: 15px;
}

.white {
  fill: white;
}
</style>
