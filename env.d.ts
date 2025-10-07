/// <reference types="vite/client" />

// Screen Capture API types
declare global {
  interface CaptureController {
    setFocusBehavior(focusBehavior: 'focus-capturing-application' | 'no-focus-change'): void;
  }

  interface DisplayMediaStreamOptions {
    controller?: CaptureController;
  }

  var CaptureController: {
    prototype: CaptureController;
    new(): CaptureController;
  };
}

export {};
