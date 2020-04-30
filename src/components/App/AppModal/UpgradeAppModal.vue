<template>
  <div class="UpgradeAppModal">
    <h1 class="UpgradeAppModal-title">
      A new version of UPchieve is available!
    </h1>
    <h2 class="UpgradeAppModal-subtitle">
      Visit the app store to download the latest version.
    </h2>
    <div v-if="!mobileMode" class="seperator" />

    <div class="UpgradeAppModal-buttons">
      <large-button @click.native="onClose()">No thanks.</large-button>
      <!-- @TODO: Add link to app store for ios and android -->
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
    // @todo: set a link to the respective os app store
    const device = getOperatingSystem();
    if (device === "Android") {
      this.appStoreLink = GOOGLE_PLAY_STORE_LINK;
    }
    if (device === "iOS") {
      this.appStoreLink = APP_STORE_LINK;
    }
  },
  computed: {
    ...mapGetters({ mobileMode: "app/mobileMode" })
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
