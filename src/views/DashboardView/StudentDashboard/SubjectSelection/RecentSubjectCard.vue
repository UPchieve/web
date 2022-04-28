<template>
  <button class="SubjectCard" :disabled="disabled">
    <component class="SubjectCard-icon" v-bind:is="svg" />
    <span class="SubectCard-title">{{ title }}</span>
    <arrow-icon class="arrow-icon" />
  </button>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import ArrowIcon from '@/assets/arrow.svg'
import MathSVG from '@/assets/subject_icons/math.svg'

export default {
  name: 'recent-subject-card',
  components: { ArrowIcon, MathSVG },
  data() {
    return {}
  },

  beforeDestroy() {
    clearTimeout(this.timeoutId)
  },
  props: {
    title: {
      type: String,
      required: true
    },
    svg: {
      type: Object,
      required: true,
      default: MathSVG
    },
    topic: String,
    buttonText: {
      type: String,
      default: 'Subject'
    },
    routeTo: String,
    disableSubjectCard: {
      type: Boolean,
      default: false
    },
    showArrow: {
      type: Boolean,
      default: false
    }
  },
  computed: {
    ...mapState({
      latestSession: state => state.user.latestSession,
      isMobileApp: state => state.app.isMobileApp,
      user: state => state.user.user
    }),
    ...mapGetters({
      mobileMode: 'app/mobileMode',
      isSessionAlive: 'user/isSessionAlive'
    }),

    disabled() {
      return this.disableSubjectCard
    }
  }
}
</script>

<style lang="scss" scoped>
.SubjectCard {
  @include flex-container(row, center, center);
  @include font-category('button');
  @include child-spacing(left, 5px);

  justify-content: space-around;
  align-items: center;
  width: 285px;
  height: 64px;
  margin-left: 0px;
  margin-right: 24px;
  background-color: white;
  border: 1px solid #d8dee5;
  box-sizing: border-box;
  border-radius: 8px;
  position: relative;
  cursor: pointer;

  &:hover:enabled {
    background-color: darken(#f2fbf9, 0%);
    border: 1px solid #16d2aa;
  }
  &:active:enabled {
    background-color: darken(#f1f3f6, 0%);
    border: 1px solid #abb2bd;
  }
}

.SubjectCard:hover .arrow-icon {
  visibility: initial;
  fill: #16d2aa;
}
.SubjectCard:active .arrow-icon {
  visibility: initial;
  fill: black;
}
.SubjectCard:hover:disabled .arrow-icon {
  visibility: hidden;
}

.arrow-icon {
  visibility: hidden;
  margin-left: 10px;
  width: 16px;

  /* UPchieve Green */
  box-sizing: border-box;
}

.SubjectCard-icon {
  position: relative;
  left: 0px;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
}

.SubjectCard:disabled {
  opacity: 75%;
}

//away by 24px from icon
.SubjectCard-title {
  @include font-category('heading');
  text-align: center;
  font-family: Work Sans, Helvetica, Arial, sans-serif;
  font-style: normal;
  font-size: 16px;
  line-height: 125%;
  width: 40%;
  flex: 0 0 130px;

  @include breakpoint-above('medium') {
    @include font-category('display-small');
    white-space: nowrap;
  }
}

.SubjectCard-mobile-column {
  @include flex-container(column, center, flex-start);
  @include child-spacing(top, 8px);
}

.SubjectCard-desktop-column {
  @include flex-container(row, initial, center);
  @include child-spacing(top, 16px);
}
</style>
