
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  backgrounds: {
    default: 'white',
    values: [
      {
        name: 'white',
        value: '#FFF'
      },
      {
        name: 'grey',
        value: '#808080'
      },
      {
        name: 'black',
        value: '#000'
      },
      {
        name: 'upchieve green',
        value: '#16D2AA'
      }
    ]
  }
}