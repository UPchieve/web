import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { dayjs } from '@/utils/time-utils'
import { mount, VueWrapper, flushPromises } from '@vue/test-utils'
import { createStore } from 'vuex'

import router from '@/router'
import userModule from '@/store/modules/user'
import subjectsModule from '@/store/modules/subjects'
import NetworkService from '@/services/NetworkService'
import StudentClassesView from '@/views/StudentClassesView.vue'

const DEFAULT_USER = {
  userType: 'student',
}
const SUBJECTS: { [subjectName: string]: any } = {
  prealgebra: {
    id: 1,
    name: 'prealgebra',
    displayName: 'Prealgebra',
    topicName: 'math',
    topicId: 1,
  },
  algebraOne: {
    id: 2,
    name: 'algebraOne',
    displayName: 'Algebra 1',
    topicName: 'math',
    topicId: 1,
  },
  algebraTwo: {
    id: 3,
    name: 'algebraTwo',
    displayName: 'Algebra 2',
    topicName: 'math',
    topicId: 1,
  },
}

function getWrapper() {
  return mount(StudentClassesView, {
    global: {
      plugins: [
        router,
        createStore({
          modules: {
            user: {
              ...userModule,
              state: {
                user: {
                  ...DEFAULT_USER,
                },
              },
            },
            subjects: {
              ...subjectsModule,
              state: {
                subjects: SUBJECTS,
              },
            },
          },
        }),
      ],
    },
  })
}

function getElements(wrapper: VueWrapper) {
  return {
    studentClasses: wrapper.findAll('[data-testid="student-class"]'),
    studentClassNames: wrapper.findAll('[data-testid="student-class-name"]'),
    noClassesContainer: wrapper.find('[data-testid="no-classes-container"]'),
    errorMessageContainer: wrapper.find(
      '[data-testid="error-message-container"]'
    ),
    currentAssignments: wrapper.findAll('[data-testid="current-assignments"]'),
    currentAssignmentsTitles: wrapper.findAll(
      '[data-testid="current-assignment-title"]'
    ),
    currentAssignmentsDueDates: wrapper.findAll(
      '[data-testid="current-assignment-due-date"]'
    ),
    pastAssignments: wrapper.findAll('[data-testid="past-assignments"]'),
    pastAssignmentsTitles: wrapper.findAll(
      '[data-testid="past-assignment-title"]'
    ),
    pastAssignmentsDueDates: wrapper.findAll(
      '[data-testid="past-assignment-due-date"]'
    ),
    pastAssignmentsStatuses: wrapper.findAll(
      '[data-testid="past-assignment-status"]'
    ),
    noAssignmentsContainer: wrapper.find(
      '[data-testid="no-assignments-container"]'
    ),
    startSessionButtons: wrapper.findAll(
      '[data-testid="start-session-button"]'
    ),
  }
}

function buildStudentClass() {
  return {
    id: faker.string.uuid(),
    active: true,
    name: faker.lorem.words(2),
    topicId: 1,
  }
}

function buildStudentAssignment(
  classId: string,
  options: { dueDate?: Date; isCompleted?: boolean; startDate?: Date } = {}
) {
  options = {
    dueDate: faker.date.soon(),
    isCompleted: false,
    startDate: faker.date.recent(),
    ...options,
  }

  const subjectName = faker.helpers.arrayElement([
    'prealgebra',
    'algebraOne',
    'algebraTwo',
  ])
  return {
    id: faker.string.uuid(),
    classId,
    description: faker.lorem.sentences(5),
    dueDate: options.dueDate,
    isRequired: true,
    minDurationInMinutes: faker.number.int({ min: 10, max: 60 }),
    numberOfSessions: faker.number.int({ min: 1, max: 5 }),
    startDate: options.startDate,
    submittedAt: options.isCompleted ? faker.date.recent() : undefined,
    subjectId: subjectName ? SUBJECTS[subjectName].id : undefined,
    subjectName: subjectName,
    title: faker.lorem.words(3),
  }
}

describe('StudentClassesView', () => {
  beforeEach(async () => {
    vi.restoreAllMocks()
  })

  test('shows a list of the student classes', async () => {
    const fakeClasses = [buildStudentClass(), buildStudentClass()]
    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: fakeClasses,
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { studentClassNames } = getElements(wrapper)
    expect(studentClassNames.length).toBe(fakeClasses.length)

    const firstClass = studentClassNames.find(
      (c) => c.element.innerHTML === fakeClasses[0].name
    )
    expect(firstClass).toBeTruthy()
    const secondClass = studentClassNames.find(
      (c) => c.element.innerHTML === fakeClasses[1].name
    )
    expect(secondClass).toBeTruthy()
  })

  test('updates the URL to include the class id', async () => {
    const routerReplaceSpy = vi.spyOn(router, 'replace')
    const fakeClasses = [
      buildStudentClass(),
      buildStudentClass(),
      buildStudentClass(),
    ]
    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: fakeClasses,
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [],
      },
    })

    const wrapper = getWrapper()
    await flushPromises()
    expect(routerReplaceSpy).toHaveBeenCalledWith(
      `/classes/${fakeClasses[0].id}`
    )

    const { studentClasses } = getElements(wrapper)

    await studentClasses[1].trigger('click')
    expect(routerReplaceSpy).toHaveBeenCalledWith(
      `/classes/${fakeClasses[1].id}`
    )

    await studentClasses[2].trigger('click')
    expect(routerReplaceSpy).toHaveBeenCalledWith(
      `/classes/${fakeClasses[2].id}`
    )

    await studentClasses[0].trigger('click')
    expect(routerReplaceSpy).toHaveBeenCalledWith(
      `/classes/${fakeClasses[0].id}`
    )

    routerReplaceSpy.mockReset()
  })

  test('shows no classes yet if student has no classes', async () => {
    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { noClassesContainer, studentClasses } = getElements(wrapper)
    expect(noClassesContainer).toBeTruthy()
    expect(studentClasses.length).toBe(0)
  })

  test('shows an error if there is an error message', async () => {
    const errorMessageContainerText = 'You got an error!'
    NetworkService.getStudentClasses = vi.fn().mockRejectedValue({
      response: {
        data: {
          err: errorMessageContainerText,
        },
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { errorMessageContainer } = getElements(wrapper)
    expect(errorMessageContainer.element.innerHTML).toContain(
      errorMessageContainerText
    )
  })

  test('shows no assignments yet if student has no assignments for the class', async () => {
    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [buildStudentClass()],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { noAssignmentsContainer, currentAssignments, pastAssignments } =
      getElements(wrapper)
    expect(noAssignmentsContainer).toBeTruthy()
    expect(currentAssignments.length + pastAssignments.length).toBe(0)
  })

  test('shows the assignments with their due dates for each class', async () => {
    const class0 = buildStudentClass()
    const class1 = buildStudentClass()
    const class2 = buildStudentClass()
    const class0Assignments = [
      buildStudentAssignment(class0.id),
      buildStudentAssignment(class0.id),
      buildStudentAssignment(class0.id),
    ]
    const class1Assignments = [
      buildStudentAssignment(class1.id),
      buildStudentAssignment(class1.id),
    ]
    const class2Assignments = [
      buildStudentAssignment(class2.id),
      buildStudentAssignment(class2.id),
      buildStudentAssignment(class2.id),
      buildStudentAssignment(class2.id),
    ]

    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [class0, class1, class2],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: class0Assignments
          .concat(class1Assignments)
          .concat(class2Assignments),
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { studentClasses } = getElements(wrapper)
    let { currentAssignments, pastAssignments } = getElements(wrapper)
    let combinedAssignments = currentAssignments.concat(pastAssignments)
    expect(combinedAssignments.length).toBe(class0Assignments.length)

    await studentClasses[1].trigger('click')
    ;({ currentAssignments, pastAssignments } = getElements(wrapper))
    combinedAssignments = currentAssignments.concat(pastAssignments)
    expect(combinedAssignments.length).toBe(class1Assignments.length)

    await studentClasses[2].trigger('click')
    ;({ currentAssignments, pastAssignments } = getElements(wrapper))
    combinedAssignments = currentAssignments.concat(pastAssignments)
    expect(combinedAssignments.length).toBe(class2Assignments.length)
  })

  test('shows the current assignments and the past assignments in different sections', async () => {
    const studentClass = buildStudentClass()
    const currentAssignment = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().endOf('day').toDate(),
      isCompleted: false,
      startDate: dayjs().subtract('7', 'days').toDate(),
    })
    const pastAssignment = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().subtract('1', 'day').toDate(),
      isCompleted: false,
      startDate: dayjs().subtract('7', 'days').toDate(),
    })
    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [studentClass],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [pastAssignment, currentAssignment],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { currentAssignments, pastAssignments } = getElements(wrapper)

    expect(currentAssignments.length).toBe(1)
    expect(pastAssignments.length).toBe(1)
    expect(currentAssignments[0].element.innerHTML).toContain(
      currentAssignment.title
    )
    expect(pastAssignments[0].element.innerHTML).toContain(pastAssignment.title)
  })

  test('shows the current assignments in ascending order of due date (i.e. soonest to being due first)', async () => {
    const studentClass = buildStudentClass()
    const assignmentFirst = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().add('1', 'day').toDate(),
    })
    const assignmentMiddle = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().add('2', 'day').toDate(),
    })
    const assignmentLast = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().add('3', 'day').toDate(),
    })

    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [studentClass],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [assignmentMiddle, assignmentLast, assignmentFirst],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const {
      currentAssignments,
      currentAssignmentsTitles,
      currentAssignmentsDueDates,
    } = getElements(wrapper)
    expect(currentAssignments.length).toBe(3)
    expect(currentAssignmentsTitles[0].element.innerHTML).toBe(
      assignmentFirst.title
    )
    expect(currentAssignmentsDueDates[0].element.innerHTML).toContain(
      dayjs(assignmentFirst.dueDate).format('MM/DD/YYYY')
    )
    expect(currentAssignmentsTitles[1].element.innerHTML).toContain(
      assignmentMiddle.title
    )
    expect(currentAssignmentsDueDates[1].element.innerHTML).toContain(
      dayjs(assignmentMiddle.dueDate).format('MM/DD/YYYY')
    )
    expect(currentAssignmentsTitles[2].element.innerHTML).toContain(
      assignmentLast.title
    )
    expect(currentAssignmentsDueDates[2].element.innerHTML).toContain(
      dayjs(assignmentLast.dueDate).format('MM/DD/YYYY')
    )
  })

  test('shows the past assignments in descending order of due date (i.e. most recently due first)', async () => {
    const studentClass = buildStudentClass()
    const assignmentFirst = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().subtract('1', 'day').toDate(),
    })
    const assignmentMiddle = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().subtract('2', 'day').toDate(),
    })
    const assignmentLast = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().subtract('3', 'day').toDate(),
    })

    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [studentClass],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [assignmentMiddle, assignmentLast, assignmentFirst],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { pastAssignments, pastAssignmentsTitles, pastAssignmentsDueDates } =
      getElements(wrapper)
    expect(pastAssignments.length).toBe(3)
    expect(pastAssignmentsTitles[0].element.innerHTML).toBe(
      assignmentFirst.title
    )
    expect(pastAssignmentsDueDates[0].element.innerHTML).toContain(
      dayjs(assignmentFirst.dueDate).format('MM/DD/YYYY')
    )
    expect(pastAssignmentsTitles[1].element.innerHTML).toContain(
      assignmentMiddle.title
    )
    expect(pastAssignmentsDueDates[1].element.innerHTML).toContain(
      dayjs(assignmentMiddle.dueDate).format('MM/DD/YYYY')
    )
    expect(pastAssignmentsTitles[2].element.innerHTML).toContain(
      assignmentLast.title
    )
    expect(pastAssignmentsDueDates[2].element.innerHTML).toContain(
      dayjs(assignmentLast.dueDate).format('MM/DD/YYYY')
    )
  })

  test('does not show assignments with start dates in the future', async () => {
    const studentClass = buildStudentClass()
    const assignmentInFuture = buildStudentAssignment(studentClass.id, {
      startDate: dayjs().add('1', 'day').toDate(),
    })

    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [studentClass],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [assignmentInFuture],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { currentAssignments, pastAssignments } = getElements(wrapper)
    expect(currentAssignments.length).toBe(0)
    expect(pastAssignments.length).toBe(0)
  })

  test('shows a past assignment as completed even if the due date is not yet past', async () => {
    const studentClass = buildStudentClass()
    const completedAssignment = buildStudentAssignment(studentClass.id, {
      // Assignment isn't due for another 5 days.
      dueDate: dayjs().add('5', 'days').toDate(),
      isCompleted: true,
      startDate: dayjs().subtract('7', 'day').toDate(),
    })

    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [studentClass],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [completedAssignment],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { currentAssignments, pastAssignments, pastAssignmentsStatuses } =
      getElements(wrapper)
    expect(currentAssignments.length).toBe(0)
    expect(pastAssignments.length).toBe(1)
    expect(pastAssignmentsStatuses.length).toBe(1)
    expect(pastAssignmentsStatuses[0].element.innerHTML).toBe('Completed')
  })

  test('show a past assignment as completed if past the due date and was completed', async () => {
    const studentClass = buildStudentClass()
    const completedAssignment = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().subtract('2', 'days').toDate(),
      isCompleted: true,
      startDate: dayjs().subtract('7', 'day').toDate(),
    })

    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [studentClass],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [completedAssignment],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { currentAssignments, pastAssignments, pastAssignmentsStatuses } =
      getElements(wrapper)
    expect(currentAssignments.length).toBe(0)
    expect(pastAssignments.length).toBe(1)
    expect(pastAssignmentsStatuses.length).toBe(1)
    expect(pastAssignmentsStatuses[0].element.innerHTML).toBe('Completed')
  })

  test('shows a past assignment as incomplete if past the due date and not completed', async () => {
    const studentClass = buildStudentClass()
    const incompleteAssignment = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().subtract('1', 'day').toDate(),
      isCompleted: false,
      startDate: dayjs().subtract('7', 'day').toDate(),
    })

    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [studentClass],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [incompleteAssignment],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { currentAssignments, pastAssignments, pastAssignmentsStatuses } =
      getElements(wrapper)
    expect(currentAssignments.length).toBe(0)
    expect(pastAssignments.length).toBe(1)
    expect(pastAssignmentsStatuses.length).toBe(1)
    expect(pastAssignmentsStatuses[0].element.innerHTML).toBe('Incomplete')
  })

  test('starts a session with the subject when click to start a session', async () => {
    const routerPushSpy = vi.spyOn(router, 'push')
    const studentClass = buildStudentClass()
    const assignment = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().add('3', 'day').toDate(),
      isCompleted: false,
    })

    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [studentClass],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [assignment],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { startSessionButtons } = getElements(wrapper)
    expect(startSessionButtons.length).toBe(1)
    await startSessionButtons[0].trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith(
      `/session/math/${assignment.subjectName}?assignmentId=${assignment.id}`
    )
    routerPushSpy.mockReset()
  })

  test('navigates to view the assignment details if click the assignment title', async () => {
    const routerPushSpy = vi.spyOn(router, 'push')
    routerPushSpy.mockReset()

    const studentClass = buildStudentClass()
    const assignment = buildStudentAssignment(studentClass.id, {
      dueDate: dayjs().add('3', 'day').toDate(),
      isCompleted: false,
    })

    NetworkService.getStudentClasses = vi.fn().mockResolvedValue({
      data: {
        classes: [studentClass],
      },
    })
    NetworkService.getStudentAssignments = vi.fn().mockResolvedValue({
      data: {
        assignments: [assignment],
      },
    })
    NetworkService.getAssignmentDocuments = vi.fn().mockResolvedValue({
      data: { assignmentDocuments: [] },
    })

    const wrapper = getWrapper()
    await flushPromises()

    const { currentAssignmentsTitles } = getElements(wrapper)
    expect(currentAssignmentsTitles.length).toBe(1)
    await currentAssignmentsTitles[0].trigger('click')

    expect(routerPushSpy).toHaveBeenCalledWith(
      `/classes/${assignment.classId}/assignments/${assignment.id}`
    )
    routerPushSpy.mockReset()
  })
})
