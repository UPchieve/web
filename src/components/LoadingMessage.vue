<template>
  <div class="loading-container">
    <span>{{ message }}</span>
    <span v-if="!isMobileAppIOS" class="loading-ellipsis" />
    <span class="interval-ellipsis">{{ animatedEllipsis }}</span>
  </div>
</template>

<script>
import { mapState } from "vuex";
import getOperatingSystem from "@/utils/get-operating-system";

export default {
  props: {
    message: { type: String, required: true }
  },
  data() {
    return {
      isMobileAppIOS: false,
      intervalTimeoutId: null,
      animatedEllipsis: ""
    };
  },
  computed: {
    ...mapState({
      isMobileApp: state => state.app.isMobileApp
    })
  },
  created() {
    // @todo
    // @note: animation for LoadingMessage when in the NotificationModal
    //        is being inconsistent with mobile app ios devices
    //        even with this workaround
    if (getOperatingSystem() === "iOS" && this.isMobileApp) {
      this.isMobileAppIOS = true;
      this.intervalTimeoutId = setInterval(() => {
        if (this.animatedEllipsis.length === 3) {
          this.animatedEllipsis = "";
        } else {
          this.animatedEllipsis += ".";
        }
      }, 500);
    }
  },
  beforeDestroy() {
    clearInterval(this.intervalTimeoutId);
  }
};
</script>

<style lang="scss" scoped>
.loading-container {
  display: inline-block;
  position: relative;
}

.loading-ellipsis {
  text-align: left;
  position: absolute;

  &:after {
    content: "...";
    display: inline-block;
    width: 25px;
    overflow: hidden;
    -webkit-animation: 1.2s ellip infinite;
    animation: 1.2s ellip infinite;
  }
}

.interval-ellipsis {
  text-align: left;
  position: absolute;
}

@keyframes ellip {
  0% {
    width: 0px;
  }

  33% {
    width: 5px;
  }

  66% {
    width: 10px;
  }

  100% {
    width: 25px;
  }
}
</style>
