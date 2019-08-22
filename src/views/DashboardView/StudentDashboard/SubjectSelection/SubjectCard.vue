<template>
  <div class="SubjectCard">
    <template v-if="mobileMode">
      <img class="SubjectCard-icon" :src="svgUrl" />

      <div class="SubjectCard-mobile-column">
        <h2 class="SubjectCard-title">{{ title }}</h2>
        <hyperlink-button primary>{{ buttonText }}</hyperlink-button>
      </div>
    </template>

    <template v-else>
      <div class="SubjectCard-desktop-column">
        <img class="SubjectCard-icon" :src="svgUrl" />
        <h2 class="SubjectCard-title">{{ title }}</h2>
        <p class="SubjectCard-subtitle">{{ subtitle }}</p>
        <dropdown-list
          v-if="dropdownOptions"
          v-model="value"
          class="SubjectCard-dropdown"
          disabledOption="Choose a subject"
          :options="dropdownOptions"
        />
      </div>

      <large-button primary :disabled="dropdownOptions && value === ''">{{ buttonText }}</large-button>
    </template>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import DropdownList from "@/components/DropdownList";
import HyperlinkButton from "@/components/HyperlinkButton";
import LargeButton from "@/components/LargeButton";

export default {
  components: { DropdownList, HyperlinkButton, LargeButton },
  data() {
    return {
      value: ""
    };
  },
  props: {
    title: {
      type: String,
      required: true
    },
    subtitle: {
      type: String,
      default: "Join a chat room to start."
    },
    svgUrl: {
      type: String,
      required: true
    },
    subjects: Array,
    buttonText: {
      type: String,
      default: "Start a chat"
    }
  },
  computed: {
    ...mapGetters({ mobileMode: "app/mobileMode" }),
    dropdownOptions() {
      if (this.subjects && this.subjects.length > 0) {
        const options = {};
        this.subjects.forEach(
          subject => (options[subject.toLowerCase()] = subject)
        );
        return options;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.SubjectCard {
  @include flex-container(row, flex-start);
  @include child-spacing(left, 24px);

  background: white;
  border-radius: 8px;
  padding: 16px;

  @include breakpoint-above("medium") {
    @include flex-container(column, space-between, center);
    @include child-spacing(left, 0);
    @include child-spacing(top, 32px);
    flex: 1;
    padding: 32px;
    padding-top: 24px;
    min-width: 340px;
  }
}

.SubjectCard-icon {
  width: 80px;
  height: 80px;
}

.SubjectCard-title {
  @include font-category("heading");
  margin: 0;
  padding: 0;

  @include breakpoint-above("medium") {
    @include font-category("display-small");
    white-space: nowrap;
  }
}

.SubjectCard-subtitle {
  @include font-category("body");
  color: $c-secondary-grey;
  margin: 0;
  padding: 0;
}

.SubjectCard-mobile-column {
  @include flex-container(column, center, flex-start);
  @include child-spacing(top, 8px);
}

.SubjectCard-desktop-column {
  @include flex-container(column, initial, center);
  @include child-spacing(top, 16px);

  .SubjectCard-subtitle {
    margin-top: 8px;
  }
}

.SubjectCard-dropdown {
  min-width: 260px;
}
</style>
