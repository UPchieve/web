<template>
  <div class="ReferralModal">
    <component v-if="!mobileMode" :is="modalData.svg" class="icon" />
    <h1 class="ReferralModal-title">Invite Your Friends</h1>
    <h2 class="ReferralModal-subtitle">
      Every friend you refer to UPchieve will get you one entry into our monthly
      drawing for a $100 gift card. Make sure your friends use the link below to
      sign up! Next drawing will be on {{ nextMonth }} 1st.
    </h2>

    <div>
      <h4>Share link</h4>
      <div class="ReferralModal-referral-container" @click="copyLink">
        <input
          :value="referralLink"
          class="ReferralModal-referral-link"
          disabled
        />
        <span class="ReferralModal-copy-message">
          {{ copyMessage }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from "vuex";
import moment from "moment";

export default {
  props: {
    modalData: { type: Object, required: true }
  },
  data() {
    return {
      selectedSubtopic: "",
      copyMessage: "Copy"
    };
  },
  computed: {
    ...mapState({
      user: state => state.user.user
    }),
    ...mapGetters({ mobileMode: "app/mobileMode" }),
    referralLink() {
      const { referralCode } = this.user;
      if (process.env.NODE_ENV === "development") {
        return `http://localhost:8080/referral/${referralCode}`;
      } else {
        return `${process.env.VUE_APP_SERVER_ROOT}/referral/${referralCode}`;
      }
    },
    nextMonth() {
      return moment()
        .add(1, "month")
        .startOf("month")
        .format("MMMM");
    }
  },
  methods: {
    async copyLink() {
      if (!navigator.clipboard) {
        return;
      }
      try {
        await navigator.clipboard.writeText(this.referralLink);
        this.copyMessage = "Copied";
      } catch (error) {
        this.copyMessage = "Copy";
      }
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

.icon {
  align-self: center;
}

.ReferralModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  @include breakpoint-above("medium") {
    @include child-spacing(top, 16px);
  }

  &-referral-container {
    border: 1px solid $c-border-grey;
    border-radius: 8px;
    padding: 0.4em 1em;
    display: inline-block;
    display: flex;
    justify-content: space-between;
    margin-bottom: 1em;
    align-self: center;
    margin: 0 auto;

    @include breakpoint-above("medium") {
      width: 100%;
    }
  }

  &-referral-link {
    text-overflow: ellipsis;
    padding-right: 2em;
    cursor: pointer;
    border: 0;
    width: 100%;
    background-color: transparent;

    @include breakpoint-above("medium") {
      text-overflow: initial;
      padding-right: 1em;
    }
  }

  &-copy-message {
    margin: 0;
    padding: 0;
    cursor: pointer;
    color: $c-success-green;
  }
}

.ReferralModal-title {
  @include font-category("display-small");
  @include breakpoint-above("medium") {
    margin-top: 24px;
  }
}

.ReferralModal-subtitle {
  @include font-category("body");
  color: $c-secondary-grey;
}
</style>
