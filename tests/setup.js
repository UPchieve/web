import Worker from './__mocks__/workerMock'

// createObjectURL and Worker are not supported in the jest browser, hence we need to mock them or else, the tests fail
window.Worker = Worker
window.URL.createObjectURL = jest.fn()
