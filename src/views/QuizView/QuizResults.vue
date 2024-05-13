<template>
  <div :style="popUpBorderStyle" class="score-container">
    <div>
      <p id="title-quiz-result" class="score-container--header">
        {{ headerMsg }}
      </p>
      <p
        :class="{
          'score--passed': quizResults.passed,
          'score--failed': !quizResults.passed,
        }"
        class="score"
      >
        {{ scoreMsg }}
      </p>
      <p class="instructions">
        {{ instructionMsg }}
      </p>
    </div>
    <div class="btn-container">
      <large-button
        v-if="leftBtn.route"
        :showArrow="false"
        :routeTo="leftBtn.route"
        class="btn"
      >
        {{ leftBtn.text }}
      </large-button>
      <large-button
        v-else-if="leftBtn.handleClick"
        :showArrow="false"
        @click.native="leftBtn.handleClick"
        class="btn"
      >
        {{ leftBtn.text }}
      </large-button>
      <large-button
        v-if="!isFirstQuiz && !quizResults.passed"
        :showArrow="false"
        @click.native="middleBtn.handleClick"
        class="btn"
      >
        {{ middleBtn.text }}
      </large-button>
      <large-button
        v-if="rightBtn.route"
        primary
        :showArrow="false"
        :routeTo="rightBtn.route"
        class="btn"
      >
        {{ rightBtn.text }}
      </large-button>
      <large-button
        v-else-if="rightBtn.handleClick"
        primary
        :showArrow="false"
        @click.native="rightBtn.handleClick"
        class="btn"
      >
        {{ rightBtn.text }}
      </large-button>
    </div>
  </div>
</template>

<script>
import { mapState } from 'vuex'
import Case from 'case'
import LargeButton from '@/components/LargeButton.vue'

export default {
  props: {
    quizResults: { type: Object, required: true },
    quizLength: { type: Number, required: true },
    reloadQuiz: { type: Function, required: true },
    isFirstQuiz: { type: Boolean, required: true },
  },
  components: {
    LargeButton,
  },
  data() {
    return {
      scoreMsg: '',
      showRetakeQuiz: false,
      headerMsg: '',
      instructionMsg: '',
      category: '',
      leftBtn: { text: '', route: '', handleClick: undefined },
      rightBtn: { text: '', route: '', handleClick: undefined },
      popUpBorderStyle: {},
      scoreStyle: {},
    }
  },
  mounted() {
    const subject = Case.camel(this.$route.params.category)
    this.category = subject
    const isTrainingSubject = this.quizResults.isTrainingSubject

    if (this.quizResults.passed) {
      this.headerMsg = 'What a rockstar! You passed!'

      this.instructionMsg = this.isFirstQuiz
        ? `Once you finish setting up your account on your dashboard, you'll be notified of student requests for help in this subject. If you want to help students with even more subjects, just pass more quizzes located in the "Training" tab.`
        : isTrainingSubject
          ? "Now that you have this certification, you're one step closer to being able to help students!"
          : "Now that you have this certification, you'll be notified of student requests for help in this subject. If you want to help students with even more subjects, just pass more quizzes!"
      this.leftBtn = { text: 'Review answers', handleClick: this.showReview }
      this.rightBtn = {
        text: 'Take another quiz',
        route: '/training',
      }
      if (this.isFirstQuiz)
        this.rightBtn = {
          text: 'Go to Dashboard',
          route: '/dashboard',
        }
    } else {
      this.headerMsg = "You failed this time, but don't give up!"
      this.instructionMsg = isTrainingSubject
        ? 'Please try taking this quiz again after reviewing your incorrect answers and checking out the training course materials again.'
        : 'Please try taking this quiz again after reviewing your incorrect answers and checking out the subject-specific review materials we provide on the Training page.'
      this.leftBtn = {
        text: 'Review concepts',
        route: isTrainingSubject
          ? `/training/course/${Case.kebab(this.category)}`
          : `/training/review/${Case.kebab(this.category)}`,
      }
      this.middleBtn = { text: 'Review answers', handleClick: this.showReview }
      if (this.isFirstQuiz)
        this.rightBtn = { text: 'Review answers', handleClick: this.showReview }
      else this.rightBtn = { text: 'Retake quiz', handleClick: this.reloadQuiz }
    }

    this.scoreMsg = `Score: ${this.quizResults.score} out of ${this.quizLength} correct.`
  },
  methods: {
    showReview() {
      this.$emit('showReview')
    },
  },
  computed: {
    ...mapState({
      subjects: (state) => state.subjects.subjects,
      training: (state) => state.subjects.training,
      user: (state) => state.user.user,
    }),
  },
}
</script>

<style lang="scss" scoped>
.btn {
  margin-top: 1em;
  width: 100px;

  @include breakpoint-above('tiny') {
    width: 150px;
  }

  @include breakpoint-above('small') {
    width: initial;
  }

  @include breakpoint-above('medium') {
    margin-bottom: 0;
    margin-left: 1em;
  }

  @include breakpoint-above('large') {
    margin-bottom: 0;
    margin-left: 2em;
  }
}

.btn-container {
  @include flex-container(row, space-around, center);
  width: 100%;
  margin-top: 4em;

  @include breakpoint-above('medium') {
    @include flex-container(row, flex-end, center);
  }
}

.score {
  margin-top: 1.25em;
  font-weight: 600;

  &--passed {
    color: $c-success-green;
  }

  &--failed {
    color: $c-error-red;
  }
}

.score-container {
  margin-top: 1em;

  &--header {
    font-weight: 500;
  }
}

@media screen and (max-width: 890px) {
  .score-container {
    width: 100%;
    left: 0;
  }
}
</style>
