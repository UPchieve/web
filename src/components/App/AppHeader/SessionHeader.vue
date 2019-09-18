<template>
  <div class="session-header">
    <div class="session-header__left">
      <router-link
        to="/dashboard"
        class="session-header__dashboard-link"
      >← Back to dashboard</router-link>
    </div>
    <div class="session-header__center">
      <router-link to="/">
        <img class="session-header__logo" :src="logoUrl" />
      </router-link>
    </div>
    <div class="session-header__right"></div>
  </div>
</template>

<script>
import LogoImageUrl from "@/assets/header_logo.png";
import HyperlinkButton from "@/components/HyperlinkButton";

export default {
  name: "session-header",
  components: { HyperlinkButton },
  data() {
    return { logoUrl: LogoImageUrl };
  }
};
</script>

<style lang="scss" scoped>

.session-header {
  @include flex-container(row, space-between, center);
  flex: 1;

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
    text-align: right;
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
