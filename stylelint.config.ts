import type { Config } from 'stylelint'

export default {
  ignoreFiles: ['**/*', '!src/components/PresentationComponents/**'],
  overrides: [
    { files: ['**/*.vue'], customSyntax: 'postcss-html' },
    { files: ['**/*.scss'], customSyntax: 'postcss-scss' },
  ],
  plugins: ['stylelint-declaration-strict-value'],
  rules: {
    'color-no-hex': true,
    'scale-unlimited/declaration-strict-value': [
      [
        '/color$/',
        'fill',
        'stroke',
        '/^(margin|padding)-/',
        '/gap$/',
        '/radius$/',
        'font-family',
        'font-weight',
        'font-size',
        'line-height',
        'transition-duration',
        'transition-timing-function',
      ],
      {
        expandShorthand: true,
        ignoreValues: [
          '0',
          'auto',
          'inherit',
          'transparent',
          'currentColor',
          'none',
        ],
        message:
          'Use a design token or mixin from src/scss/setup instead of "${value}" for ${property}',
      },
    ],
    'media-feature-name-disallowed-list': [
      '/width$/',
      {
        message:
          "Use the breakpoint mixins from src/scss/setup, with get-breakpoint('...') for breakpoint-between",
      },
    ],
  },
} satisfies Config
