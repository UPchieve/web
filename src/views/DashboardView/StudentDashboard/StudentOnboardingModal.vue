<template>
  <div class="OnboardingModal">
    <div class="OnboardingModal-container">
      <h1 class="OnboardingModal-title">
        {{ views[step].title }}
      </h1>
      <p class="OnboardingModal-subtitle">
        {{ views[step].subtitle }}
      </p>
      <p v-if="views[step].tip">
        <span class="tip">Tip</span>: {{ views[step].tip }}
      </p>
    </div>

    <div v-if="!mobileMode" class="seperator" />
    <div class="OnboardingModal-buttons">
      <large-button @click.native="nextStep()" class="large-button">
        <div class="next-button">
          {{ views[step].button }} <arrow-icon class="icon" />
        </div>
      </large-button>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import LargeButton from "@/components/LargeButton";
import ArrowIcon from "@/assets/arrow.svg";

export default {
  components: { LargeButton, ArrowIcon },
  props: {
    modalData: { type: Object, required: true }
  },
  data() {
    return {
      step: 0,
      views: [
        {
          title: "Welcome to UPchieve! 🎉",
          subtitle:
            "You’re almost ready to get started! We just need to lay down some ground rules.",
          button: "I'm listening"
        },
        {
          title: "Rule #1: Be patient when making a request.",
          subtitle:
            "Pairing you with a coach can take up to 10 minutes. We know waiting’s hard, but we promise a coach is on their way 🏃🏿‍♂️ Don’t leave ‘em hanging!",
          tip:
            "Our coaches are patient, too. Ask as many questions as you want in the same session! There’s no time limit.",
          button: "Patience, check"
        },
        {
          title: "Rule #2: Play nice with your coach.",
          subtitle:
            "Our coaches are real people with real feelings — No 🤖 here. They’re eager to help you, so please be kind and respectful.",
          button: "I promise to bring my best self"
        },
        {
          title: "Rule #3: Stay safe out there.",
          subtitle:
            "You came to UPchieve for homework help, not the ☕. Keep conversations on-topic, and don’t share personal info like your phone number, IG handle, or email.",
          button: "Got it, I’m here to learn"
        },
        {
          title: "You’re ready for your first session! 💯",
          subtitle:
            "Thank you for listening. We can tell this is going to be the beginning of a beautiful friendship.",
          button: "Take me to my dashboard"
        }
      ]
    };
  },
  computed: {
    ...mapGetters({
      mobileMode: "app/mobileMode"
    })
  },
  methods: {
    nextStep() {
      if (this.step === this.views.length - 1) {
        this.$store.dispatch("app/modal/hide");
        this.$store.dispatch("user/firstDashboardVisit", false);
      } else {
        this.step += 1;
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

p {
  font-size: 16px;
  color: #77778b;
}

.OnboardingModal {
  @include flex-container(column);
  @include child-spacing(top, 24px);
  height: 100%;

  &-container {
    min-height: 180px;
  }
}

.OnboardingModal-title {
  @include font-category("display-small");
  margin-bottom: 1.4em;
  @include breakpoint-above("medium") {
    margin-top: 24px;
  }
}

.OnboardingModal-subtitle {
  @include font-category("heading");
  color: $c-secondary-grey;
  margin-bottom: 1em;
}

.OnboardingModal-buttons {
  @include flex-container(column);
  @include child-spacing(top, 16px);
  margin-top: auto;
  margin-bottom: 4em;

  @include breakpoint-above("medium") {
    @include child-spacing(top, 0);

    flex-direction: row;
    justify-content: flex-end;
    margin-top: 1.4em;
    margin-bottom: 0;
  }
}

.seperator {
  border: 1px solid $c-border-grey;
  width: 100%;
  height: 1px;
  margin-top: 2em;
}

.next-button {
  display: flex;
  align-items: center;
  border: none;
}

.large-button {
  color: white;
  background-color: $c-success-green;
  border: 1px solid $c-success-green;
  border-radius: 300px;
  margin-bottom: 0.5em;
  padding: 1em 0.4em;

  &:hover {
    border: 1px solid $c-success-green;
  }

  @include breakpoint-above("medium") {
    padding: 0.8em 1.8em;
  }
}

.icon {
  fill: white;
  margin-left: 1em;
  width: 20px;
  height: 20px;
}

.tip {
  font-weight: 600;
}
</style>
