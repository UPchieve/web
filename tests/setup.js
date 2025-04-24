import Worker from './__mocks__/workerMock'
import 'vitest-canvas-mock'

// createObjectURL and Worker are not supported in the jest browser, hence we need to mock them or else, the tests fail
window.Worker = Worker
window.URL.createObjectURL = vi.fn()
// window.navigator.mediaDevices.getUserMedia = vi.fn(() => Promise.resolve())
Object.defineProperty(window.navigator, 'mediaDevices', {
  value: vi.fn().mockImplementation(() => ({
    getUserMedia: vi.fn(),
  })),
})
