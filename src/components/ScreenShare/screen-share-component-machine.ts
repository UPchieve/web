import { setup, assign, fromCallback, type AnyEventObject } from 'xstate'

const unminimizeActor = fromCallback(
  ({
    sendBack,
    input,
  }: {
    sendBack: (event: AnyEventObject) => void
    input: {
      previousState: 'UserSized' | 'Maximized'
      width: number
      height: number
      x: number
      y: number
      resize: ({
        width,
        height,
        x,
        y,
      }: {
        width: number
        height: number
        x: number
        y: number
      }) => void
    }
  }) => {
    if (input.previousState === 'UserSized') {
      const { width, height, x, y } = input
      input.resize({ width, height, x, y })
      sendBack({ type: 'resized', width, height, x, y })
    } else {
      sendBack({ type: 'maximized' })
    }
  }
)

const resizeActor = fromCallback(
  ({
    sendBack,
    input,
  }: {
    sendBack: (event: AnyEventObject) => void
    input: {
      width: number
      height: number
      x: number
      y: number
    }
  }) => {
    sendBack({
      type: 'resized',
      width: input.width,
      height: input.height,
      x: input.x,
      y: input.y,
    })
  }
)

const maximizeActor = fromCallback(
  ({
    sendBack,
    input,
  }: {
    sendBack: (event: AnyEventObject) => void
    input: {
      previousWidth: number
      previousHeight: number
      maximize: ({
        previousWidth,
        previousHeight,
      }: {
        previousWidth: number
        previousHeight: number
      }) => void
    }
  }) => {
    input.maximize({
      previousWidth: input.previousWidth,
      previousHeight: input.previousHeight,
    })
    sendBack({ type: 'maximized' })
  }
)

const minimizeActor = fromCallback(
  ({ input }: { input: { minimize: () => void } }) => {
    input.minimize()
  }
)

export const machine = setup({
  types: {
    context: {} as {
      previousState: 'UserSized' | 'Maximized'
      width: number
      height: number
      x: number
      y: number
      isVolunteer: boolean
      maximize: ({
        previousWidth,
        previousHeight,
      }: {
        previousWidth: number
        previousHeight: number
      }) => void
      minimize: () => void
      resize: ({
        width,
        height,
        x,
        y,
      }: {
        width: number
        height: number
        x: number
        y: number
      }) => void
    },
    events: {} as
      | { type: 'toggleMinimize' }
      | { type: 'toggleMaximize' }
      | {
          type: 'resized'
          width: number
          height: number
          x: number
          y: number
        }
      | {
          type: 'moved'
          x: number
          y: number
        },
    input: {} as {
      isVolunteer: boolean
      width: number
      height: number
      x: number
      y: number
      maximize: ({
        previousWidth,
        previousHeight,
      }: {
        previousWidth: number
        previousHeight: number
      }) => void
      minimize: () => void
      resize: ({
        width,
        height,
        x,
        y,
      }: {
        width: number
        height: number
        x: number
        y: number
      }) => void
    },
  },
  guards: {
    isVolunteer: ({ context }) => context.isVolunteer,
  },
  actors: {
    'unminimize actor': unminimizeActor,
    'resize actor': resizeActor,
    'maximize actor': maximizeActor,
    'minimize actor': minimizeActor,
  },
}).createMachine({
  context: ({ input }) => ({
    isVolunteer: input.isVolunteer,
    previousState: 'UserSized',
    width: input.width,
    height: input.height,
    x: input.x,
    y: input.y,
    maximize: input.maximize,
    minimize: input.minimize,
    resize: input.resize,
  }),
  id: 'window',
  initial: 'UserSized',
  description: `This machine tracks and manages the state of the screen share window and ensures that
    transitions between states are predictable.`,

  states: {
    UserSized: {
      description:
        'The window is in a user-sized state, where the user has and can manually resize the window.',
      on: {
        moved: {
          target: 'UserSized',
          actions: assign({
            x: ({ event }) => event.x,
            y: ({ event }) => event.y,
          }),
        },
        resized: {
          target: 'UserSized',
          actions: assign({
            width: ({ event }) => event.width,
            height: ({ event }) => event.height,
            x: ({ event }) => event.x,
            y: ({ event }) => event.y,
          }),
        },
        toggleMaximize: {
          target: 'Maximized',
        },
        toggleMinimize: {
          target: 'Minimized',
          actions: assign({ previousState: () => 'UserSized' }),
        },
      },
    },
    Maximized: {
      description:
        'The window is maximized, filling the entire parent container.',
      invoke: {
        src: 'maximize actor',
        input: ({ context }) => ({
          maximize: context.maximize,
          previousWidth: context.width,
          previousHeight: context.height,
        }),
      },
      on: {
        toggleMaximize: {
          target: 'UserSized',
          actions: ({ context }) =>
            context.resize({
              width: context.width,
              height: context.height,
              x: context.x,
              y: context.y,
            }),
        },
        toggleMinimize: {
          target: 'Minimized',
          actions: assign({ previousState: () => 'Maximized' }),
        },
        resized: {
          target: 'UserSized',
          actions: assign({
            width: ({ event }) => event.width,
            height: ({ event }) => event.height,
          }),
        },
      },
    },
    Minimized: {
      description:
        'The window is minimized, and is shown as just the window header. The user can maximize from this state or uniminimze from to the previous state',
      invoke: {
        src: 'minimize actor',
        input: ({ context }) => ({
          minimize: context.minimize,
        }),
      },
      on: {
        toggleMaximize: { target: 'Maximized' },
        toggleMinimize: { target: 'Unminimizing' },
        moved: {
          target: 'Minimized',
          actions: assign({
            x: ({ event }) => event.x,
            y: ({ event }) => event.y,
          }),
        },
      },
    },
    Unminimizing: {
      description:
        'This state is entered from the `Minimized` state and then issues the appropriate transition based on the previous state.',
      invoke: {
        src: 'unminimize actor',
        input: ({ context }) => ({
          previousState: context.previousState,
          resize: context.resize,
          width: context.width,
          height: context.height,
          x: context.x,
          y: context.y,
        }),
      },
      on: {
        maximized: { target: 'Maximized' },
        resized: {
          target: 'UserSized',
          actions: assign({
            width: ({ event }) => event.width,
            height: ({ event }) => event.height,
            x: ({ event }) => event.x,
            y: ({ event }) => event.y,
          }),
        },
      },
    },
  },
})
