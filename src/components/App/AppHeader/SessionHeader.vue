<template>
  <div class="session-header">
    <div class="session-header__left">
      <router-link to="/dashboard" class="session-header__dashboard-link"
        >← Back to dashboard</router-link
      >
    </div>
    <div class="session-header__center">
      <router-link to="/">
        <img class="session-header__logo" :src="logoUrl" alt="UPchieve" />
      </router-link>
    </div>
    <div class="session-header__right">
      <report-session-button v-if="sessionId" :variant="'tertiary'" />
      <end-session-button v-if="sessionId" :variant="'secondary'" />
    </div>
  </div>
</template>

<script>
import LogoImageUrl from '@/assets/header_logo.png'
import ReportSessionButton from '@/components/ReportSessionButton.vue'
import EndSessionButton from '@/components/EndSessionButton.vue'

export default {
  name: 'session-header',
  components: { ReportSessionButton, EndSessionButton },
  data() {
    return { logoUrl: LogoImageUrl }
  },
  computed: {
    sessionId() {
      return this.$store.state.user?.session?.id
    },
  },
}
</script>

<style lang="scss" scoped>
.session-header {
  @include flex-container(row, space-between, center);
  flex: 1;

  @include header-child;

  & > * {
    flex-basis: 1px;
    flex-grow: 1;
  }

  &__left {
    text-align: left;
  }

  &__center {
    text-align: center;
  }

  &__right {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }

  &__logo {
    width: 94px;
    height: 40px;
  }

  &__dashboard-link {
    text-decoration: none;
    color: $c-soft-black;
  }
}
</style>
