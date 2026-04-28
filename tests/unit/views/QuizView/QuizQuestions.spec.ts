import { mount } from '@vue/test-utils'
import QuizQuestions from '@/views/QuizView/QuizQuestions.vue'
import { it, describe, vi, beforeEach, expect } from 'vitest'
import TrainingService from '@/services/TrainingService'
import { nextTick } from 'vue'
describe('QuizQuestions component', () => {
  const mockTrainingService = vi.mocked(TrainingService)

  const SELECTORS = {
    questionText: '[data-testid="question-text"]',
    questionImage: '[data-testid="question-image"]',
    questionImageContainer: '[data-testid="question-image-container"]',
    questionImageContainerExpanded:
      '[data-testid="question-image-expanded-container"]',
    expandImageButton: '[data-testid="expand-image"]',
    collapseImageButton: '[data-testid="collapse-image"]',
    nextQuestionButton: '[data-testid="btn-question-next"]',
    previousQuestionButton: '[data-testid="btn-question-previous"]',
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  vi.stubGlobal('MathJax', {
    typesetClear: vi.fn(),
    typesetPromise: vi.fn().mockResolvedValue(undefined),
  })

  const getWrapper = () => {
    return mount(QuizQuestions, {
      propsData: {
        quizLength: 2,
      },
    })
  }

  const answer1 = {
    txt: 'Q1 answer 1',
    val: 'a2',
  }
  const answer2 = {
    txt: 'Q2 answer 2',
    val: 'a2',
  }
  const BASE_QUESTION = {
    category: 'calculusAB',
    subcategory: 'antiderivatives',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  const question1 = {
    ...BASE_QUESTION,
    id: '1',
    _id: '1',
    questionText: 'Question 1 text',
    possibleAnswers: [answer1, answer2],
    correctAnswer: answer1.val,
    imageSrc: 'test-image-src-1',
  }
  const question2 = {
    ...BASE_QUESTION,
    id: '2',
    _id: '2',
    questionText: 'Question 2 text',
    possibleAnswers: [answer1, answer2],
    correctAnswer: answer1.val,
  }
  const mockQuiz = {
    msg: 'Quiz',
    questions: [question1, question2],
  }

  const validateQuestion = async (wrapper, question: any) => {
    // Text
    const questionText = wrapper.find(SELECTORS.questionText)
    expect(questionText.text()).toEqual(question.questionText)

    // Image
    const hasImage = !!question?.imageSrc
    const questionImageContainer = wrapper.find(
      SELECTORS.questionImageContainer
    )
    expect(questionImageContainer.exists()).toBe(hasImage)
    expect(wrapper.find(SELECTORS.questionImage).exists()).toBe(hasImage)

    if (hasImage) {
      expect(
        questionImageContainer.html().includes(`url(${question1.imageSrc})`)
      )

      // Expand image
      expect(
        wrapper.find(SELECTORS.questionImageContainerExpanded).exists()
      ).toBe(false)
      const expandButton = wrapper.find(SELECTORS.expandImageButton)
      expect(expandButton.exists()).toBe(true)
      await expandButton.trigger('click')
      await nextTick()
      expect(
        wrapper.find(SELECTORS.questionImageContainerExpanded).exists()
      ).toBe(true)
      expect(
        wrapper.find(SELECTORS.questionImageContainerExpanded).html()
      ).includes(`src="${question1.imageSrc}"`)

      // Close expanded view
      await wrapper.find(SELECTORS.collapseImageButton).trigger('click')
      await nextTick()
      expect(
        wrapper.find(SELECTORS.questionImageContainerExpanded).exists()
      ).toBe(false)
    }
  }

  it('Updates the current question data when navigating to previous and next question', async () => {
    mockTrainingService.getFirstQuestion = vi
      .fn()
      .mockReturnValue(mockQuiz.questions[0])
    mockTrainingService.hasNext = vi.fn().mockReturnValue(true)
    mockTrainingService.getIndex = vi.fn().mockReturnValue(0)
    mockTrainingService.saveAnswer = vi.fn()
    mockTrainingService.hasPrevious = vi.fn().mockReturnValue(false)
    mockTrainingService.getNextQuestion = vi
      .fn()
      .mockReturnValue({ picked: false, question: question2 })

    const wrapper = getWrapper()
    await nextTick()

    // Validate first question is correct
    await validateQuestion(wrapper, question1)
    // No previous question
    expect(wrapper.find('[data-testid="btn-question-previous"]').exists()).toBe(
      false
    )

    // Navigate to next
    mockTrainingService.hasPrevious.mockReturnValue(true)
    await wrapper.find(SELECTORS.nextQuestionButton).trigger('click')
    await nextTick()
    // No next question, but there is a previous one
    expect(wrapper.find('[data-testid="btn-question-previous"]').exists()).toBe(
      true
    )
    await validateQuestion(wrapper, question2)

    // Navigate to previous
    mockTrainingService.getPreviousQuestion = vi
      .fn()
      .mockReturnValue({ picked: true, question: question1 })
    await wrapper.find(SELECTORS.previousQuestionButton).trigger('click')
    await nextTick()
    await validateQuestion(wrapper, question1)
  })
})
