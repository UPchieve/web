<template>
  <div class="UpgradeAppModal">
    <h1 class="UpgradeAppModal-title">
      A new version of UPchieve is available!
    </h1>
    <h2 class="UpgradeAppModal-subtitle">
      Visit the app store to download the latest version.
    </h2>
    <div class="UpgradeAppModal-release-notes">
      <h3 class="UpgradeAppModal-release-notes__header">
        The latest version includes the following update(s):
      </h3>
      <ul class="UpgradeAppModal-release-notes__list">
        <li
          v-for="note in newReleaseNotes"
          :key="note"
          class="UpgradeAppModal-release-notes__note"
        >
          {{ note }}
        </li>
      </ul>
    </div>

    <div v-if="!mobileMode" class="seperator" />

    <div class="UpgradeAppModal-buttons">
      <large-button @click.native="onClose()">No thanks.</large-button>
      <a :href="appStoreLink" target="_blank" class="UpgradeAppModal-link">
        <large-button primary>Take me to the app store!</large-button>
      </a>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import LargeButton from "@/components/LargeButton";
import getOperatingSystem from "@/utils/get-operating-system";
import { GOOGLE_PLAY_STORE_LINK, APP_STORE_LINK } from "@/consts";

export default {
  components: { LargeButton },
  props: {
    modalData: { type: Object, required: true }
  },
  data() {
    return {
      appStoreLink: ""
    };
  },
  mounted() {
    const device = getOperatingSystem();
    if (device === "Android") {
      this.appStoreLink = GOOGLE_PLAY_STORE_LINK;
    }
    if (device === "iOS") {
      this.appStoreLink = APP_STORE_LINK;
    }
  },
  computed: {
    ...mapGetters({ mobileMode: "app/mobileMode" }),
    newReleaseNotes() {
      return [
        "Take + send photos to your coaches",
        "Share photos from your phone’s library"
      ];
    }
  },
  methods: {
    onClose() {
      this.$emit("cancel");
      this.$store.dispatch("app/modal/hide");
    }
  }
};
</script>

<style lang="scss" scoped>
h1,
h2,
p {
  margin: 0;
  padding: 0;
}

.UpgradeAppModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  height: 100%;

  &-release-notes {
    @include flex-container(column, center, center);
    margin-top: 2em;

    &__header {
      @include font-category("heading");
    }

    &__list {
      margin-top: 0;
    }

    &__note {
      @include font-category("body");
      text-align: left;
    }
  }
}

.UpgradeAppModal-title {
  @include font-category("display-small");
  @include breakpoint-above("medium") {
    margin-top: 24px;
  }
}

.UpgradeAppModal-subtitle {
  @include font-category("heading");
  color: $c-secondary-grey;
}

.UpgradeAppModal-buttons {
  @include flex-container(column);
  @include child-spacing(top, 16px);
  margin-top: auto;
  margin-bottom: 4em;

  & button {
    margin-bottom: 0.5em;
    padding: 1em 0;
  }

  @include breakpoint-above("medium") {
    @include child-spacing(top, 0);

    flex-direction: row;
    justify-content: flex-end;
    margin-top: 1.4em;
    margin-bottom: 0;

    & button {
      padding: 0.8em;
    }

    & button:first-child {
      margin-right: 1em;
    }
  }
}

.UpgradeAppModal-link {
  & > button {
    width: 100%;
  }
}

.seperator {
  border: 1px solid $c-border-grey;
  width: 100%;
  height: 1px;
  margin-top: 2em;
}
</style>
