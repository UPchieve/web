<template>
  <div :style="popUpBorderStyle" class="score-container">
    <div>
      <h2>{{ headerMsg }}</h2>
      <p :style="scoreStyle" class="score">{{ scoreMsg }}</p>
      <p class="instructions">
        {{ instructionMsg }}
      </p>
    </div>
    <div class="btn-container">
      <button class="review-btn btn" type="button" @click="showReview">
        Review answers
      </button>
      <router-link :to="rightBtn.route" tag="button" class="btn">{{
        rightBtn.text
      }}</router-link>
      <button
        class="btn"
        type="button"
        @click="reloadQuiz"
        v-if="!quizResults.passed"
      >
        Retake quiz
      </button>
    </div>
  </div>
</template>

<script>
import { mapState, mapGetters } from 'vuex'
import Case from 'case'

export default {
  props: {
    quizResults: { type: Object, required: true },
    quizLength: { type: Number, required: true },
    reloadQuiz: { type: Function, required: true },
  },
  data() {
    return {
      scoreMsg: '',
      showRetakeQuiz: false,
      headerMsg: '',
      instructionMsg: '',
      category: '',
      rightBtn: { text: '', route: '' },
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
      this.instructionMsg = isTrainingSubject
        ? "Now that you have this certification, you're one step closer to being able to help students!"
        : "Now that you have this certification, you'll be notified of student requests for help in this subject. If you want to help students with even more subjects, just pass more quizzes!"
      this.popUpBorderStyle = {
        borderBottom: '5px solid #16D2AA',
        borderLeft: '5px solid #16D2AA',
      }
      this.scoreStyle = { color: '#16D2AA' }
      this.rightBtn = {
        text: 'Take another quiz',
        route: '/training',
      }
      if (this.isAutoFlowAvailabilityStepUser)
        this.rightBtn = {
          text: 'Done',
          route: '/welcome',
        }
    } else {
      this.headerMsg = "You failed this time, but don't give up!"
      this.instructionMsg = isTrainingSubject
        ? 'Please try taking this quiz again after reviewing your incorrect answers and checking out the training course materials again.'
        : 'Please try taking this quiz again after reviewing your incorrect answers and checking out the subject-specific review materials we provide on the Training page.'
      this.popUpBorderStyle = {
        borderBottom: '5px solid #F44747',
        borderLeft: '5px solid #F44747',
      }
      this.scoreStyle = { color: '#F44747' }
      this.leftBtn = { text: 'Review answers', route: '' }
      this.rightBtn = {
        text: 'Review concepts',
        route: isTrainingSubject
          ? `/training/course/${Case.kebab(this.category)}`
          : `/training/review/${Case.kebab(this.category)}`,
      }
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
      subjects: state => state.subjects.subjects,
      training: state => state.subjects.training,
      user: state => state.user.user,
    }),
    ...mapGetters({
      isAutoFlowAvailabilityStepUser: 'user/isAutoFlowAvailabilityStepUser',
    }),
  },
}
</script>

<style lang="scss" scoped>
h2 {
  font-size: 20px;
}

// todo: make global button to import
.btn {
  background: #f6f6f6;
  border-radius: 20px;
  min-width: 140px;
  box-sizing: content-box;
  height: 26px;
  line-height: 26px;
  color: #16d2aa;
  font-weight: 600;
  margin-bottom: 1.4em;

  @include breakpoint-above('large') {
    width: 27%;
    margin-bottom: 0;
  }
}

.btn:hover {
  background-color: #16d2aa;
  color: #fff;
}

.instructions {
  margin: 50px 0;
}

.btn-container {
  @include flex-container(column, space-around, center);
  width: 100%;
  margin: 4em auto;

  @include breakpoint-above('large') {
    @include flex-container(row, space-around, center);
  }
}

// override global style from router-link
.btn.active {
  box-shadow: initial;
}

.score {
  margin-top: 20px;
  font-weight: 600;
}

.instructions {
  width: 80%;
  margin: 1.4em auto 0;
}

.score-container {
  margin-top: 1em;
  padding-top: 1em;
}

@media screen and (max-width: 890px) {
  .score-container {
    width: 100%;
    left: 0;
  }
}
</style>
