<template>
  <button
    v-if="showDashboardRedesign"
    :data-testid="`${topic}-subject-card`"
    class="subject-card uc-row justify-center"
    @click="handleClick"
    :disabled="isDisabled ? true : null"
  >
    <img :src="svg" class="icon" aria-hidden="true" />
    <div class="uc-column justify-center items-start">
      <h2 class="title">{{ title }}</h2>
      <p class="metadata">{{ metadata }}</p>
    </div>
  </button>
  <div v-else class="SubjectCard" :data-testid="`${topic}-subject-card`">
    <template v-if="mobileMode">
      <component
        class="SubjectCard-icon"
        v-if="isComponentSvg"
        v-bind:is="svg"
      />
      <img v-else :src="svg" :alt="altImageText" class="SubjectCard-icon" />

      <div class="SubjectCard-mobile-column">
        <h2 class="SubjectCard-title">{{ title }}</h2>
        <hyperlink-button
          v-if="routeTo"
          primary
          data-testid="start-chat"
          :routeTo="routeTo"
          :disabled="isDisabled ? true : null"
          >{{ buttonText }}</hyperlink-button
        >
        <hyperlink-button
          v-else
          primary
          data-testid="start-chat"
          @click="handleClick"
          :disabled="isDisabled ? true : null"
          >{{ buttonText }}</hyperlink-button
        >
      </div>
    </template>

    <template v-else>
      <div class="SubjectCard-desktop-column">
        <component
          class="SubjectCard-icon"
          v-if="isComponentSvg"
          v-bind:is="svg"
        />
        <img v-else :src="svg" :alt="altImageText" class="SubjectCard-icon" />
        <h2 class="SubjectCard-title">{{ title }}</h2>
        <p class="SubjectCard-subtitle">{{ subtitle }}</p>
        <dropdown-list
          v-if="subtopics"
          :data-testid="`${title}-dropdown`"
          v-model="selectedSubtopic"
          class="SubjectCard-dropdown"
          disabledOption="Choose a subject"
          :options="subtopics"
          :optionDisplay="subtopicDisplayNames"
          :disabled="isDisabled ? true : null"
        />
      </div>

      <hyperlink-button
        v-if="routeTo"
        primary
        data-testid="start-chat"
        :routeTo="routeTo"
        :disabled="isDisabled ? true : null"
        >{{ buttonText }}</hyperlink-button
      >
      <large-button
        v-else
        primary
        data-testid="start-chat"
        @click="handleClick"
        :disabled="isDisabled ? true : null"
        >{{ buttonText }}</large-button
      >
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import DropdownList from '@/components/DropdownList.vue'
import HyperlinkButton from '@/components/HyperlinkButton.vue'
import LargeButton from '@/components/LargeButton.vue'
import AnalyticsService from '@/services/AnalyticsService'
import { EVENTS } from '@/consts'

export default {
  compatConfig: { COMPONENT_V_MODEL: false },
  components: { DropdownList, HyperlinkButton, LargeButton },
  data() {
    return {
      selectedSubtopic: '',
    }
  },
  beforeUnmount() {
    clearTimeout(this.timeoutId)
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    subtitle: {
      type: String,
      default: 'Join a chat room to start.',
    },
    svg: {
      type: [Object, String],
      required: true,
    },
    topic: String,
    subtopics: Array,
    subtopicDisplayNames: Object,
    buttonText: {
      type: String,
      default: 'Start a chat',
    },
    routeTo: String,
    isDisabled: Boolean,
  },
  computed: {
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      showDashboardRedesign: 'user/showDashboardRedesign',
    }),
    metadata() {
      const numSubtopics = this.subtopics.length
      const pluralization = numSubtopics === 1 ? '' : 's'
      return numSubtopics + ' Subject' + pluralization
    },
    isComponentSvg() {
      return typeof this.svg === 'object'
    },
    altImageText() {
      return `${this.topic.toLowerCase()} icon`
    },
  },
  methods: {
    handleClick() {
      if (this.title === 'Invite Your Friends') {
        AnalyticsService.captureEvent(
          EVENTS.STUDENT_CLICKED_TO_GET_REFERRAL_LINK_CARD
        )
        this.$store.dispatch('app/modal/show', {
          component: 'ReferralModal',
          data: {
            svg: this.svg,
            showAccept: false,
          },
        })
      } else {
        this.$store.dispatch('app/modal/show', {
          component: 'SubjectSelectionModal',
          data: {
            backText: 'Dashboard',
            acceptText: 'Continue',
            topic: this.topic,
            title: this.title,
            subtopics: this.subtopics,
            subtopicDisplayNames: this.subtopicDisplayNames,
            svg: this.svg,
            preSelectedSubtopic: this.selectedSubtopic,
            subtitle:
              'Choose a subject so we can connect you with the right tutor.',
          },
        })
      }
    },
  },
}
</script>

<style lang="scss" scoped>
.subject-card {
  background: white;
  border: 1px solid #d8dee5;
  border-radius: 8px;
  padding: 16px;

  &:hover,
  &:focus {
    background: #f2fbf9;
    border-color: #16d2aa;
  }

  &[disabled] {
    background: #f1f3f6;
    border-color: #d8dee5;
  }
  .icon {
    height: 80px;
    margin-right: 16px;
    width: 80px;
  }

  .title {
    @include font-category('heading');
    font-weight: 600;
    margin: 0;
    padding: 0;
    text-align: start;
  }

  .metadata {
    @include font-category('helper-text');
    color: #565961;
    text-align: start;
    margin: 0;
  }
}

.SubjectCard {
  @include flex-container(row, flex-start);
  @include child-spacing(left, 24px);

  background: white;
  border-radius: 8px;
  padding: 16px;

  @include breakpoint-above('medium') {
    @include flex-container(column, space-between, center);
    @include child-spacing(left, 0);
    @include child-spacing(top, 32px);
    padding: 32px;
    padding-top: 24px;
  }
}

.SubjectCard-icon {
  width: 80px;
  height: 80px;
}

.SubjectCard-title {
  @include font-category('heading');
  margin: 0;
  padding: 0;
  text-align: left;

  @include breakpoint-above('medium') {
    @include font-category('display-small');
    white-space: nowrap;
  }
}

.SubjectCard-subtitle {
  @include font-category('body');
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
