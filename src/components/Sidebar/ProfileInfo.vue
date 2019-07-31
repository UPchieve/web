<template>
  <div class="profile-info">
    <div :style="avatarStyle" class="avatar" />
    <template>
      <p
        v-if="
          ($route.path.indexOf('/onboarding') !== -1 ||
            $route.path.indexOf('/signup') !== -1) &&
            !user.isVolunteer
        "
        class="greeting"
      >
        Welcome, Student!
      </p>
      <p
        v-else-if="
          $route.path.indexOf('/onboarding') !== -1 ||
            $route.path.indexOf('/signup') !== -1
        "
        class="greeting"
      >
        Welcome, Volunteer!
      </p>
      <p
        v-else-if="!user.isVolunteer && user.firstname === undefined"
        class="greeting"
      >
        Welcome, Student!
      </p>
      <p
        v-else-if="user.isVolunteer && user.firstname === undefined"
        class="greeting"
      >
        Welcome, Volunteer!
      </p>
      <p v-else class="greeting">
        {{ name }}
      </p>
    </template>
  </div>
</template>

<script>
import UserService from "@/services/UserService";
import AuthService from "@/services/AuthService";
import StudentAvatarUrl from "@/assets/defaultavatar3.png";
import VolunteerAvatarUrl from "@/assets/defaultavatar4.png";

/**
 * @todo {1} Refactor this, apply naming convention to files and improve the
 *           the style of the block.
 */
export default {
  data() {
    const user = UserService.getUser() || {};
    const avatarUrl = // {1}
      user.picture ||
      (user.isVolunteer ? VolunteerAvatarUrl : StudentAvatarUrl);

    return {
      user,
      avatarStyle: {
        backgroundImage: `url(${avatarUrl})`
      }
    };
  },
  computed: {
    name: {
      cache: false,
      get() {
        return `${this.user.firstname} ${this.user.lastname}`;
      }
    }
  },
  methods: {
    logout() {
      AuthService.logout(this);
    }
  }
};
</script>

<style lang="scss" scoped>
.avatar {
  display: block;
  width: 60px;
  height: 60px;
  margin: 0 auto;
  background-size: cover;
}

.greeting {
  margin-top: 12px;
  margin-bottom: 0;
  font-size: 16px;
}

.edit-profile {
  font-size: 12px;
  color: #73737a;
}
</style>
