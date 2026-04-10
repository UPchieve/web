import { defineConfig } from 'html-validate'

export default defineConfig({
  plugins: ['html-validate-vue', './require-autocomplete-off.mjs'],
  extends: [
    'html-validate:recommended',
    'html-validate:a11y',
    'html-validate-vue:recommended',
    'html-validate:prettier',
  ],
  elements: ['html5', './elements.json'],
  rules: {
    'element-name': 'off',
    'element-case': ['error', { style: ['lowercase', 'pascalcase'] }],
    'no-inline-style': 'off',
    'prefer-native-element': ['error', { exclude: ['button'] }],
    'vue/prefer-slot-shorthand': 'off',
    'local/require-autocomplete-off': 'error',
    // Warn for now - TODO: actually fix in the future.
    'element-permitted-content': 'warn',
    'element-permitted-parent': 'warn',
    'wcag/h63': 'warn',
    'wcag/h37': 'warn',
    'wcag/h32': 'warn',
    'prefer-tbody': 'warn',
    'text-content': 'warn',
    'no-raw-characters': 'warn',
    'unique-landmark': 'warn',
    'no-dup-id': 'warn',
    'aria-label-misuse': 'warn',
    'element-permitted-order': 'warn',
    'multiple-labeled-controls': 'warn',
    'valid-for': 'warn',
    'no-deprecated-attr': 'warn',
    'element-permitted-occurences': 'warn',
    'prefer-native-element': 'warn',
    'element-required-attributes': 'warn',
    'element-permitted-occurrences': 'warn',
  },
  transform: {
    '^.*\\.vue$': 'html-validate-vue',
  },
})
