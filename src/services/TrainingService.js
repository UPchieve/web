import NetworkService from './NetworkService';

export default {
  idAnswerMap: {},
  questions: [],
  index: 0,
  numAnswers: 0,
  idCorrectAnswerMap: {},
  category: null,

  loadQuiz(context, category) {
    this.index = 0;
    this.numAnswers = 0;
    this.idAnswerMap = {};
    this.idCorrectAnswerMap = {};
    this.category = category;
    return NetworkService.getQuestions(context, { category }).then((res) => {
      this.questions = res.data.questions;
      return this.questions.length;
    });
  },
  getFirstQuestion() {
    const question = this.questions[this.index];
    return question;
  },
  getIndex() {
    return this.index;
  },
  hasCompleted() {
    return (this.numAnswers === this.questions.length);
  },
  hasNext() {
    return ((this.index + 1) < this.questions.length);
  },
  hasPrevious() {
    return ((this.index) > 0);
  },
  getNextQuestion() {
    if (this.index < this.questions.length) {
      this.index = this.index + 1;
      const question = this.questions[this.index];
      const picked = this.idAnswerMap[question._id];
      return {
        question,
        picked,
      };
    }
    return null;
  },
  getPreviousQuestion() {
    if (this.index > 0) {
      this.index = this.index - 1;
      const question = this.questions[this.index];
      const picked = this.idAnswerMap[question._id];
      return {
        question,
        picked,
      };
    }
    return null;
  },
  saveAnswer(context, picked) {
    const question = this.questions[this.index];
    if (
      picked !== '' &&
      picked !== null &&
      picked !== undefined &&
      (
        this.idAnswerMap[question._id] === null ||
        this.idAnswerMap[question._id] === '' ||
        picked !== undefined
      )
    ) {
      this.numAnswers += 1;
    }
    this.idAnswerMap[question._id] = picked;
  },
  submitQuiz(context, userid) {
    return NetworkService.getQuizScore(
      context,
      {
        userid,
        idAnswerMap: this.idAnswerMap,
        category: this.category,
      },
    )
      .then((res) => {
        this.idCorrectAnswerMap = res.data.idCorrectAnswerMap;
        return {
          tries: res.data.tries,
          passed: res.data.passed,
          score: res.data.score,
          idUserAnswerMap: this.idAnswerMap,
        };
      });
  },
  reviewQuiz() {
    const questionsReview = this.questions.slice(0);
    const idCorrectAnswerMap = { ...this.idCorrectAnswerMap };
    const idAnswerMap = { ...this.idAnswerMap };
    questionsReview.forEach((question) => {
      question.userAnswer = idAnswerMap[question._id];
      question.correctAnswer = idCorrectAnswerMap[question._id];
    });
    return questionsReview;
  },
};
