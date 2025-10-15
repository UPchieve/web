<template>
  <div class="container">
    <div class="progress-bar-container">
      <progress-bar
        :barWidth="barWidth"
        :quizLength="quizLength"
        :questionNumber="questionNumber"
      />
    </div>
    <div class="quiz-body">
      <div v-if="questionNumber" class="question-number">
        Question {{ questionNumber }}
      </div>
      <div class="questionText" data-testid="question-text">
        {{ questionText }}
      </div>
      <div
        class="question-image-container"
        v-if="imageSrc"
        data-testid="question-image-container"
      >
        <div
          :style="imageStyle"
          class="question-image"
          data-testid="question-image"
        />
        <image-expand-icon
          class="image-sizer-icon"
          @click="handleImageExpansion"
          data-testid="expand-image"
        />
      </div>
      <div
        v-if="isImageExpanded && imageSrc"
        @click="handleImageExpansion"
        class="upc-modal question-image-modal"
      >
        <div
          class="question-image-expanded-container"
          data-testid="question-image-expanded-container"
        >
          <image-collapse-icon
            class="image-sizer-icon"
            @click="handleImageExpansion"
            data-testid="collapse-image"
          />
          <img :src="imageSrc" class="question-image--expanded" />
        </div>
      </div>
      <form class="possible-answers" data-testid="quiz-questions">
        <div v-for="(item, index) in answersWithLabels" :key="`item-${index}`">
          <div class="options answer-option" @click="selectAnswer(item.val)">
            <input
              :value="item.val"
              v-model="picked"
              type="radio"
              :id="item.val"
              :data-testid="item.val"
              :aria-label="item.label"
              class="answer-option--input"
            />
            <label
              :for="item.val"
              :id="'answer-' + item.val"
              :data-testid="`$answer-${item.val}`"
              class="answer-option--label"
            >
              {{ item.label }}
            </label>
          </div>
        </div>
        <p class="quiz-error">{{ errorMsg }}</p>
      </form>
    </div>
    <div class="btn-container">
      <large-button
        v-if="showPrevious"
        data-testid="btn-question-previous"
        variant="secondary"
        :showArrow="false"
        @click="previous"
      >
        PREVIOUS
      </large-button>

      <large-button
        data-testid="btn-question-next"
        v-if="showNext"
        variant="secondary"
        :showArrow="false"
        @click="next"
      >
        NEXT
      </large-button>

      <large-button
        data-testid="btn-submit-quiz"
        v-if="showSubmit"
        variant="primary"
        :showArrow="false"
        @click="submit"
      >
        SUBMIT QUIZ
      </large-button>
    </div>
  </div>
</template>

<script>
import TrainingService from '@/services/TrainingService'

import ProgressBar from './ProgressBar.vue'
import ImageExpandIcon from '@/assets/image-expand.svg'
import ImageCollapseIcon from '@/assets/image-collapse.svg'
import LoggerService from '@/services/LoggerService'
import LargeButton from '@/components/LargeButton.vue'

export default {
  props: {
    quizLength: { type: Number, required: true },
  },
  data() {
    return {
      picked: '',
      showPrevious: false,
      showNext: false,
      showSubmit: false,
      questionNumber: 0,
      barWidth: 0,
      questionText: '',
      items: [],
      imageStyle: {},
      errorMsg: '',
      imageSrc: '',
      isImageExpanded: false,
    }
  },
  components: {
    ProgressBar,
    ImageExpandIcon,
    ImageCollapseIcon,
    LargeButton,
  },
  computed: {
    answersWithLabels() {
      return this.items.map((item) => ({
        ...item,
        label: `${item.val}. ${item.txt}`,
      }))
    },
  },
  mounted() {
    this.getFirstQuestion()
  },
  beforeUpdate() {
    // manually set questionText since MathJax's generated DOM elements interfere
    // with Vue's template engine when changing the text
    const questionText = document.querySelector('.questionText')
    if (questionText) questionText.innerHTML = this.questionText
  },
  updated() {
    this.rerenderMathJaxElements()
  },
  emits: ['submitQuiz'],
  methods: {
    clearMathJaxElements() {
      const quizBody = document.querySelector('.quiz-body')
      if (!quizBody) {
        LoggerService.noticeError(
          'Missing quiz body - cannot clear MathJax elements'
        )
        return
      }

      // Remove any MathJax-rendered elements from the DOM.
      // Do this before updating to avoid rendering artifacts being left behind
      const mathJaxElements = Array.from(
        quizBody.querySelectorAll('[class*=mjx],[class*=MathJax],[id*=MathJax]')
      )

      const mathJaxParentElements = Array.from(
        quizBody.querySelectorAll('.MathJax_Preview')
      ).map((e) => e.parentElement)

      mathJaxElements.forEach((e) => e.remove())

      // MathJax slices up the DOM nodes it renders as math formulas. We need to
      // rejoin these under the first child's data attribute to avoid artifacts
      // being left behind
      mathJaxParentElements.forEach((parentEl) => {
        if (!(parentEl && parentEl.firstChild)) return

        parentEl.firstChild.data = parentEl.innerText

        // Remove all child nodes but the first
        Array.from(parentEl.childNodes)
          .slice(1)
          .forEach((e) => e.remove())
      })
    },

    rerenderMathJaxElements() {
      const quiz = document.querySelector('.quiz-body')
      if (!quiz) {
        LoggerService.noticeError(
          'Missing quiz body - cannot rerender MathJax elements'
        )
        return
      }
      const questionText = quiz.querySelector('.questionText')
      const answerChoices = quiz.querySelectorAll('.possible-answers div')

      if (!questionText || !answerChoices || !answerChoices.length) {
        return
      }
      window.MathJax.Hub.Queue([
        'Typeset',
        window.MathJax.Hub,
        [
          questionText,
          ...Array.from(answerChoices).map((answerChoice) =>
            answerChoice.querySelector('.options label')
          ),
        ],
      ])
    },
    updateProgressBar() {
      // When switching to a new question, clear any mathjax elements so they
      // can be re-rendered
      this.clearMathJaxElements()

      const index = TrainingService.getIndex(this)
      this.questionNumber = TrainingService.getIndex(this) + 1
      this.barWidth = (100 / (this.quizLength - 1)) * index
      for (let i = 1; i < this.quizLength + 1; i++) {
        const element = document.getElementById(`circle-${i}`)
        if (element) {
          if (i < index + 2) {
            element.style.background = '#16D2AA'
          } else {
            element.style.background = '#EEEEEE'
          }
        }
      }
    },
    styleImage(imageSrc) {
      if (imageSrc) {
        this.imageStyle = {
          backgroundImage: `url(${imageSrc})`,
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }
      } else {
        this.imageStyle = {}
      }
    },
    getFirstQuestion() {
      const question = TrainingService.getFirstQuestion()
      this.questionText = question.questionText
      this.styleImage(question.imageSrc)
      this.imageSrc = question.imageSrc
      this.items = question.possibleAnswers
      this.showNext = true
      if (!TrainingService.hasNext()) {
        this.showNext = false
        this.showSubmit = true
      }

      this.questionNumber = TrainingService.getIndex(this) + 1
    },
    previous() {
      TrainingService.saveAnswer(this.picked)
      this.picked = ''
      const data = TrainingService.getPreviousQuestion(this)
      const { question } = data
      this.picked = data.picked
      this.questionText = question.questionText
      this.updateProgressBar()
      this.imageSrc = question.imageSrc
      this.styleImage(question.imageSrc)
      this.items = question.possibleAnswers
      if (!TrainingService.hasPrevious(this)) {
        this.showPrevious = false
      }
      if (this.errorMsg) {
        this.errorMsg = ''
      }
      this.showSubmit = false
      this.showNext = true
    },
    next() {
      TrainingService.saveAnswer(this.picked)
      this.picked = ''
      const data = TrainingService.getNextQuestion(this)
      const { question } = data
      this.picked = data.picked
      this.questionText = question.questionText
      this.imageSrc = question.imageSrc
      this.updateProgressBar()
      this.styleImage(this.imageSrc)
      this.items = question.possibleAnswers
      if (!TrainingService.hasNext(this)) {
        this.showNext = false
        this.showSubmit = true
      }
      this.showPrevious = true
    },
    submit() {
      TrainingService.saveAnswer(this.picked)
      if (!TrainingService.hasCompleted()) {
        this.errorMsg =
          'You must answer all questions before submitting the quiz!'
      } else {
        this.$emit('submitQuiz')
      }
    },
    handleImageExpansion(event) {
      event.stopImmediatePropagation()
      const { target } = event
      if (
        this.isImageExpanded &&
        target &&
        target.classList.contains('question-image--expanded')
      ) {
        return
      } else this.isImageExpanded = !this.isImageExpanded
    },
    selectAnswer(value) {
      // Workaround for MathJax breaking label-input association
      this.picked = value
    },
  },
}
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  margin: 0 auto;
}

.progress-bar-container {
  margin: 2em auto;
  width: 100%;
  max-width: 600px;
}

.quiz-body {
  width: 100%;
  max-width: 600px;
  text-align: left;
  margin: 0 auto;
  margin-bottom: 2em;
  @include child-spacing(top, $spacing-lg);
}

input[type='radio']:checked {
  background-color: #16d2aa;
}

.possible-answers {
  @include child-spacing(top, $spacing-xs);
}

label {
  font-weight: $font-weight-regular;
  display: inline;
}

.answer-option {
  @include flex-container(row, initial, center);
  cursor: pointer;

  &:hover &--label {
    background-color: $selected-green;
  }

  &--input,
  &--label {
    cursor: inherit;
  }

  &--label {
    margin-left: $spacing-xs;
    margin-bottom: 0;
    flex: 1;
    padding: $spacing-xs;
    border-radius: $radius-sm;
    transition: background-color $transition-standard;
  }

  &--input:checked + &--label {
    background-color: $upchieve-chat-bot-green;
    font-weight: $font-weight-medium;
  }
}

.question-number {
  font-weight: $font-weight-bold;
  width: 100%;
  align-self: center;
  text-align: left;
}

.quiz-error {
  color: $c-error-red;
}

.btn-container {
  @include flex-container(row, space-between);
  left: 0;
  width: 100%;

  max-width: 600px;
  left: 0;
  right: 0;
  margin: 2em auto 0;
}

.questionText {
  white-space: pre-wrap;
}

.question-image {
  &-container {
    position: relative;
    width: 300px;
    height: 300px;
  }

  &-modal {
    background: rgba(0, 0, 0, 0.4);
    @include breakpoint-below('medium') {
      @include flex-container(row, initial, center);
    }
  }

  &--expanded {
    height: 100%;
    width: 100%;
  }

  &-expanded-container {
    position: relative;
    height: 100%;
    margin: 0 auto;

    @include breakpoint-below('medium') {
      width: 80%;
      height: 80%;
    }

    @include breakpoint-below('tiny') {
      width: 90%;
      height: 90%;
    }
  }
}

.image-sizer-icon {
  position: absolute;
  width: 20px;
  height: 20px;
  margin: $spacing-sm;
  top: 0;
  right: 0;
  &:hover {
    transform: scale(1.1);
    transition: transform $transition-slow;
  }
}

@include breakpoint-below('medium') {
  .btn-container {
    width: 100%;
  }
}

@include breakpoint-below('small') {
  // override inline styling
  .question-image {
    width: 100% !important;
  }
}
</style>
