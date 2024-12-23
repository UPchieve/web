export enum ScreenShareState {
  Initial = 'Initial',
  WaitingForScreenSelection = 'WaitingForScreenSelection',
  CanNotViewScreen = 'CanNotViewScreen',
  SharingScreen = 'SharingScreen',
  JoiningScreenShare = 'JoiningScreenShare',
  FailedToJoinScreenShare = 'FailedToJoinScreenShare',
  ViewingScreenShare = 'ViewingScreenShare',
  StoppingScreenShare = 'StoppingScreenShare',
  StoppingViewScreenShare = 'StoppingViewScreenShare',
  CheckingScreenShare = 'CheckingScreenShare',
  RemovingViewer = 'RemovingViewer',
  Destroyed = 'Destroyed',
}

export enum ScreenShareEvent {
  SCREEN_SHARE_ACTIVATED = 'SCREEN_SHARE_ACTIVATED',
  SCREEN_SHARE_DEACTIVATED = 'SCREEN_SHARE_DEACTIVATED',
  JOINING_SCREEN_SHARE_FAILED = 'JOINING_SCREEN_SHARE_FAILED',
  JOINED_SCREEN_SHARE = 'JOINED_SCREEN_SHARE',
  RETRY_VIEW_SCREEN_SHARE = 'RETRY_VIEW_SCREEN_SHARE',
  VIEW_SCREEN_SHARE = 'VIEW_SCREEN_SHARE',
  VIEW_SCREEN_SHARE_STOPPED = 'VIEW_SCREEN_SHARE_STOPPED',
  CANCEL_VIEW_SCREEN_SHARE = 'CANCEL_VIEW_SCREEN_SHARE',
  SHARE_SCREEN = 'SHARE_SCREEN',
  CANCEL_SCREEN_SELECTION = 'CANCEL_SCREEN_SELECTION',
  CHOOSE_SCREEN = 'CHOOSE_SCREEN',
  STOP_SCREEN_SHARE = 'STOP_SCREEN_SHARE',
  SCREEN_SHARE_STOPPED = 'SCREEN_SHARE_STOPPED',
  MAX_VIEW_SCREEN_SHARE_RETRIES_REACHED = 'MAX_VIEW_SCREEN_SHARE_RETRIES_REACHED',
  DESTROY = 'DESTROY',
  NO_CANVAS_ELEMENT = 'NO_CANVAS_ELEMENT',
  VIEWER_READY = 'VIEWER_READY',
  NO_SCREEN_SHARE = 'NO_SCREEN_SHARE',
  VIEWER_REMOVED = 'VIEWER_REMOVED',
  SHARE_CONTENT_DIMENSION_CHANGE = 'SHARE_CONTENT_DIMENSION_CHANGE',
}

// TODO: get the types directly from the actor?
export enum ScreenShareActions {
  DESTROY = 'DESTROY',
  JOIN_SCREEN_SHARE = 'JOIN_SCREEN_SHARE',
  START_SCREEN_SHARE = 'START_SCREEN_SHARE',
  STOP_SCREEN_SHARE = 'STOP_SCREEN_SHARE',
  STOP_VIEW_SCREEN_SHARE = 'STOP_VIEW_SCREEN_SHARE',
  REMOVE_VIEWER = 'REMOVE_VIEWER',
  CHECK_SCREEN_SHARE = 'CHECK_SCREEN_SHARE',
  SHARING_SCREEN = 'SHARING_SCREEN',
}

interface FSMStateConfig {
  on?: Partial<Record<ScreenShareEvent, ScreenShareState>>
  actions?: ScreenShareActions[]
}

interface FSMDefinition {
  initial: ScreenShareState
  on?: Partial<Record<ScreenShareEvent, ScreenShareState>>
  states: Record<ScreenShareState, FSMStateConfig>
}

export const screenShareMachine: FSMDefinition = {
  initial: ScreenShareState.Initial,
  on: {
    [ScreenShareEvent.DESTROY]: ScreenShareState.Destroyed,
  },
  states: {
    [ScreenShareState.Initial]: {
      on: {
        [ScreenShareEvent.SCREEN_SHARE_ACTIVATED]:
          ScreenShareState.JoiningScreenShare,
        [ScreenShareEvent.SHARE_SCREEN]:
          ScreenShareState.WaitingForScreenSelection,
        [ScreenShareEvent.VIEWER_READY]: ScreenShareState.CheckingScreenShare,
        [ScreenShareEvent.VIEWER_REMOVED]: ScreenShareState.RemovingViewer,
      },
    },
    [ScreenShareState.CheckingScreenShare]: {
      actions: [ScreenShareActions.CHECK_SCREEN_SHARE],
      on: {
        // TODO: What happens when the sharer dismissess their VIEWER?
        [ScreenShareEvent.SCREEN_SHARE_ACTIVATED]:
          ScreenShareState.JoiningScreenShare,
        [ScreenShareEvent.NO_SCREEN_SHARE]: ScreenShareState.Initial,
      },
    },
    [ScreenShareState.WaitingForScreenSelection]: {
      actions: [ScreenShareActions.START_SCREEN_SHARE],
      on: {
        [ScreenShareEvent.CHOOSE_SCREEN]: ScreenShareState.SharingScreen,
        [ScreenShareEvent.CANCEL_SCREEN_SELECTION]: ScreenShareState.Initial,
      },
    },
    [ScreenShareState.SharingScreen]: {
      actions: [ScreenShareActions.SHARING_SCREEN],
      on: {
        [ScreenShareEvent.STOP_SCREEN_SHARE]:
          ScreenShareState.StoppingScreenShare,
        [ScreenShareEvent.VIEWER_REMOVED]: ScreenShareState.RemovingViewer,
      },
    },
    [ScreenShareState.StoppingScreenShare]: {
      actions: [ScreenShareActions.STOP_SCREEN_SHARE],
      on: {
        [ScreenShareEvent.SCREEN_SHARE_STOPPED]: ScreenShareState.Initial,
      },
    },
    [ScreenShareState.JoiningScreenShare]: {
      actions: [ScreenShareActions.JOIN_SCREEN_SHARE],
      on: {
        [ScreenShareEvent.JOINING_SCREEN_SHARE_FAILED]:
          ScreenShareState.FailedToJoinScreenShare,
        [ScreenShareEvent.JOINED_SCREEN_SHARE]:
          ScreenShareState.ViewingScreenShare,
        [ScreenShareEvent.NO_CANVAS_ELEMENT]: ScreenShareState.CanNotViewScreen,
        [ScreenShareEvent.SCREEN_SHARE_DEACTIVATED]:
          ScreenShareState.StoppingViewScreenShare,
        [ScreenShareEvent.VIEWER_REMOVED]: ScreenShareState.RemovingViewer,
      },
    },
    [ScreenShareState.FailedToJoinScreenShare]: {
      on: {
        [ScreenShareEvent.RETRY_VIEW_SCREEN_SHARE]:
          ScreenShareState.JoiningScreenShare,
        [ScreenShareEvent.CANCEL_VIEW_SCREEN_SHARE]: ScreenShareState.Initial,
        [ScreenShareEvent.MAX_VIEW_SCREEN_SHARE_RETRIES_REACHED]:
          ScreenShareState.CanNotViewScreen,
      },
    },
    [ScreenShareState.ViewingScreenShare]: {
      on: {
        [ScreenShareEvent.SCREEN_SHARE_DEACTIVATED]:
          ScreenShareState.StoppingViewScreenShare,
        [ScreenShareEvent.VIEWER_REMOVED]: ScreenShareState.RemovingViewer,
      },
    },
    [ScreenShareState.RemovingViewer]: {
      actions: [ScreenShareActions.REMOVE_VIEWER],
      on: {
        [ScreenShareEvent.VIEW_SCREEN_SHARE_STOPPED]: ScreenShareState.Initial,
      },
    },
    [ScreenShareState.StoppingViewScreenShare]: {
      actions: [ScreenShareActions.STOP_VIEW_SCREEN_SHARE],
      on: {
        [ScreenShareEvent.VIEW_SCREEN_SHARE_STOPPED]: ScreenShareState.Initial,
      },
    },
    [ScreenShareState.CanNotViewScreen]: {
      on: {
        [ScreenShareEvent.VIEWER_READY]: ScreenShareState.CheckingScreenShare,
        [ScreenShareEvent.VIEW_SCREEN_SHARE]:
          ScreenShareState.JoiningScreenShare,
      },
    },
    [ScreenShareState.Destroyed]: {
      actions: [ScreenShareActions.DESTROY],
    },
  },
}
