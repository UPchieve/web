import { isEmpty } from 'lodash-es'
import NetworkService from './NetworkService'

export type TrainingMaterial = {
  name: string
  isCompleted: boolean
  materialKey: string
  type: 'video' | 'document'
  isRequired: boolean
  description?: string
  resourceId?: string
  linkUrl?: string
  videoPDF?: string
  linkLabel?: string
  links?: {
    displayName: string
    url: string
  }[]
}

export type QuizQuestion = {
  id: number
  questionText: string
  possibleAnswers: {
    txt: string
    val: string
  }[]
  correctAnswer: string
  userAnswer?: string
  category: string
  subcategory: string
  imageSrc?: string
  createdAt: Date
  updatedAt: Date
}

export type LetterChoice = 'a' | 'b' | 'c' | 'd'
export type AnswerMap = Record<number, LetterChoice>

export default {
  idAnswerMap: {} as AnswerMap,
  questions: [] as QuizQuestion[],
  index: 0,
  numAnswers: 0,
  idCorrectAnswerMap: {} as AnswerMap,
  category: '',

  async loadQuiz(category: string): Promise<number> {
    this.index = 0
    this.numAnswers = 0
    this.idAnswerMap = {}
    this.idCorrectAnswerMap = {}
    this.category = category
    return NetworkService.getQuestions({ category }).then((res) => {
      this.questions = res.data.questions || []
      return this.questions.length
    })
  },
  getFirstQuestion(): QuizQuestion {
    return this.questions[this.index]
  },
  getIndex() {
    return this.index
  },
  hasCompleted() {
    return this.numAnswers === this.questions.length
  },
  hasNext() {
    return this.index + 1 < this.questions.length
  },
  hasPrevious() {
    return this.index > 0
  },
  getNextQuestion() {
    if (this.index < this.questions.length) {
      this.index = this.index + 1
      const question = this.questions[this.index]
      const picked = this.idAnswerMap[question.id]
      return {
        question,
        picked,
      }
    }
    return null
  },
  getPreviousQuestion() {
    if (this.index > 0) {
      this.index = this.index - 1
      const question = this.questions[this.index]
      const picked = this.idAnswerMap[question.id]
      return {
        question,
        picked,
      }
    }
    return null
  },
  saveAnswer(picked: string) {
    const question = this.questions[this.index]
    const isNewAnswer =
      isEmpty(this.idAnswerMap[question.id]) && !isEmpty(picked)
    if (isNewAnswer) {
      this.numAnswers += 1
    }
    this.idAnswerMap[question.id] = picked
  },
  async submitQuiz() {
    return NetworkService.getQuizScore({
      idAnswerMap: this.idAnswerMap,
      category: this.category,
    }).then((res) => {
      this.idCorrectAnswerMap = res.data.idCorrectAnswerMap
      return {
        tries: res.data.tries,
        passed: res.data.passed,
        score: res.data.score,
        idUserAnswerMap: this.idAnswerMap,
        isTrainingSubject: res.data.isTrainingSubject,
      }
    })
  },
  reviewQuiz() {
    const questionsReview = this.questions.slice(0)
    const idCorrectAnswerMap = { ...this.idCorrectAnswerMap }
    const idAnswerMap = { ...this.idAnswerMap }
    questionsReview.forEach((question) => {
      question.userAnswer = idAnswerMap[question.id]
      question.correctAnswer = idCorrectAnswerMap[question.id]
    })
    return questionsReview
  },

  async getQuizScore(
    quizCategory: string,
    idAnswerMap: AnswerMap
  ): Promise<{
    didPass: boolean
    answerKey: AnswerMap
    score: number
    isTrainingSubject: boolean
    tries: number
  }> {
    const { default: store } = await import('@/store')
    const quizScoreResponse = await NetworkService.getQuizScore({
      idAnswerMap: idAnswerMap,
      category: quizCategory,
    })
    const { passed, tries, score, idCorrectAnswerMap, isTrainingSubject } =
      quizScoreResponse.data
    await store.dispatch('user/addCertification', {
      certificationName: quizCategory,
      certificationInfo: { passed, score, isTrainingSubject, tries },
    })

    return {
      didPass: passed,
      answerKey: idCorrectAnswerMap,
      score,
      isTrainingSubject,
      tries,
    }
  },
}
