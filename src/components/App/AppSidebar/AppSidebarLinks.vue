<template>
  <div class="AppSidebarLinks">
    <template v-if="$route.path.indexOf('/onboarding') !== -1">
      <app-sidebar-link
        to="/onboarding/profile"
        icon="portrait"
        text="Basic profile"
      />
      <app-sidebar-link
        v-if="!isVolunteer"
        to="/onboarding/academic"
        icon="book"
        text="First time use survey"
      />
    </template>

    <template v-else-if="authenticated">
      <app-sidebar-link to="/dashboard" icon="house" text="Dashboard" />
      <app-sidebar-link
        v-if="isVolunteer"
        to="/training"
        icon="graduation-cap"
        text="Training"
      />
      <app-sidebar-link
        v-if="isVolunteer"
        to="/calendar"
        icon="calendar"
        text="Schedule"
      />
      <app-sidebar-link
        v-if="isAdmin"
        to="/admin"
        icon="folder"
        text="Admin"
      />
      <app-sidebar-link to="/profile" icon="portrait" text="Profile" />
      <app-sidebar-link to="/resources" icon="folder" text="Resources" />
    </template>

    <template v-else>
      <app-sidebar-link to="/login" text="Login" />
    </template>

    <div v-if="!mobileMode" class="AppSidebarLinks-about">About UPchieve</div>
    <app-sidebar-link to="/contact" icon="envelope" text="Contact us" />
    <app-sidebar-link to="/legal" icon="exclamation" text="Legal policy" />
  </div>
</template>

<script>
import AppSidebarLink from './AppSidebarLink';

export default {
  components: { AppSidebarLink },
  props: {
    authenticated: Boolean,
    isVolunteer: Boolean,
    isAdmin: Boolean,
    mobileMode: Boolean
  }
}
</script>

<style lang="scss" scoped>
.AppSidebarLinks {
  @include flex-container(column);
  @include child-spacing(top, 16px);

  &-about {
    @include font-category("body");
    color: $c-secondary-grey;
    margin-top: 40px;
    text-align: left;
  }
}
</style>
