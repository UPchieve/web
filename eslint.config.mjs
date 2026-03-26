import { globalIgnores } from 'eslint/config'
import globals from 'globals'
import js from '@eslint/js'
import pluginVue from 'eslint-plugin-vue'
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from '@vue/eslint-config-typescript'
import prettierConfig from '@vue/eslint-config-prettier'
import vitest from '@vitest/eslint-plugin'
import vueConfigTypescript from '@vue/eslint-config-typescript'
import vueConfigPrettier from '@vue/eslint-config-prettier'

export default defineConfigWithVueTs([
  js.configs.recommended,
  pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,
  prettierConfig,
  vueConfigPrettier,
  vueConfigTypescript,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        ...vitest.environments.env.globals,
      },

      ecmaVersion: 2022,
      parserOptions: {},
    },

    rules: {
      'no-alert': 'error',
      'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
      'vue/multi-word-component-names': 'off',
      // we should migrate towards turning these on
      '@typescript-eslint/no-explicit-any': 'off',
      'vue/block-lang': 'off',
      'vue/no-deprecated-v-on-native-modifier': 'off',
      'vue/no-deprecated-router-link-tag-prop': 'off',
      'vue/no-deprecated-model-definition': 'off',
    },
  },
  globalIgnores(['**/node_modules/', 'tests/setup.js']),
])
