import { defineConfig } from 'html-validate'

export default defineConfig({
  plugins: ['html-validate-vue', './html-validate-plugin.mjs'],
  extends: [
    'html-validate:recommended',
    'html-validate:a11y',
    'html-validate-vue:recommended',
    'html-validate:prettier',
  ],
  elements: ['html5', './elements.json'],
  rules: {
    'element-case': ['warn', { style: ['lowercase', 'pascalcase'] }],
    'no-inline-style': 'off',
    'local/require-autocomplete-off': 'error',
  },
  transform: {
    '^.*\\.vue$': 'html-validate-vue',
  },
})
