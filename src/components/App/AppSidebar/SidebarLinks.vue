<template>
  <div class="SidebarLinks">
    <template v-if="$route.path.indexOf('/onboarding') !== -1">
      <sidebar-link
        to="/onboarding/profile"
        icon="portrait"
        text="Basic profile"
      />
      <sidebar-link
        v-if="!isVolunteer"
        to="/onboarding/academic"
        icon="book"
        text="First time use survey"
      />
    </template>

    <template v-else-if="authenticated">
      <sidebar-link to="/dashboard" icon="house" text="Dashboard" />
      <sidebar-link
        v-if="isVolunteer"
        to="/training"
        icon="graduation-cap"
        text="Training"
      />
      <sidebar-link
        v-if="isVolunteer"
        to="/calendar"
        icon="calendar"
        text="Schedule"
      />
      <sidebar-link v-if="isAdmin" to="/admin" icon="folder" text="Admin" />
      <sidebar-link to="/profile" icon="portrait" text="Profile" />
      <sidebar-link
        v-if="!isVolunteer"
        to="/resources"
        icon="folder"
        text="Resources"
      />

      <div v-if="!mobileMode" class="SidebarLinks-about">About UPchieve</div>
      <sidebar-link to="/contact" icon="envelope" text="Contact us" />
      <sidebar-link to="/legal" icon="exclamation" text="Legal policy" />
    </template>
  </div>
</template>

<script>
import SidebarLink from "./SidebarLink";

export default {
  components: { SidebarLink },
  props: {
    authenticated: Boolean,
    isVolunteer: Boolean,
    isAdmin: Boolean,
    mobileMode: Boolean
  }
};
</script>

<style lang="scss" scoped>
.SidebarLinks {
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
