const config = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-links',
    'storybook-addon-pseudo-states',
    '@storybook/addon-a11y',
    '@storybook/addon-actions',
  ],

  core: {},

  framework: {
    name: '@storybook/vue-vite',
    options: {},
  },

  async viteFinal(config) {
    // Merge custom configuration into the default config
    return config
  },

  docs: {
    autodocs: true,
  },
}
export default config
