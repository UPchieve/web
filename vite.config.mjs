import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import path from 'path'
import vueDevTools from 'vite-plugin-vue-devtools'
import { playwright } from '@vitest/browser-playwright'
import { analyzer } from 'vite-bundle-analyzer'
import { visualizer } from 'rollup-plugin-visualizer'
import vuetify from 'vite-plugin-vuetify'

let svgoPrefixId = 0

export default defineConfig({
  envPrefix: 'VUE_',
  define: {
    'import.meta.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'import.meta.env.SUBWAY_CUSTOM_VOLUNTEER_PARTNER_ORGS': JSON.stringify(
      process.env.SUBWAY_CUSTOM_VOLUNTEER_PARTNER_ORGS
    ),
    global: {},
  },
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './node_modules'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    vue(),
    svgLoader({
      svgoConfig: {
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                removeViewBox: false,
                cleanupIds: true,
              },
            },
          },
          /*
           * when you have two svgs on a page and they are run through svgo,
           * it's possible that they each get assigned id="a".
           * this can break svgs in unexpected ways depending on the elements
           * present in the svgs (e.g. `<g filter="url(#a)">)`).
           *
           * we saw this with google + clever svgs where both buttons would
           * get the google logo. this plugin avoids those id collisions
           * by prefixing the value of a monotonic counter to the id
           * so that we get ids like "#1a" and "#2a", etc...
           */
          {
            name: 'prefixIds',
            params: {
              delim: '',
              prefix: () => svgoPrefixId++,
            },
          },
        ],
      },
    }),
    {
      name: 'inject-asset-hints',
      transformIndexHtml(html, ctx) {
        let fontLinks

        const fontWeights = ['400', '500', '600', '700']
        if (ctx.bundle) {
          //use hashed output filenames when building for prod
          const keys = Object.keys(ctx.bundle)
          fontLinks = keys
            .filter((f) =>
              fontWeights.some(
                (w) =>
                  f.includes(`work-sans-latin-${w}`) && f.endsWith('.woff2')
              )
            )

            .map(
              (f) =>
                `<link rel="preload" href="/${f}" as="font" type="font/woff2" crossorigin>`
            )
        } else {
          // use original source paths served by Vite dev server
          fontLinks = fontWeights.map(
            (w) =>
              `<link rel="preload" href="/node_modules/typeface-work-sans/files/work-sans-latin-${w}.woff2" as="font" type="font/woff2" crossorigin>`
          )
        }
        const tags = [...fontLinks].join('\n  ')
        return html.replace('</head>', `\n ${tags}\n</head>`)
      },
    },
    vuetify(),
    ...(!process.env.VITEST ? [vueDevTools()] : []),
    process.env.BUNDLE_ANALYZE
      ? visualizer({
          gzipSize: true,

          open: true,
          template: 'treemap',

          // open: false,
          // template: 'markdown',
        })
      : {},
    process.env.BUNDLE_ANALYZE ? analyzer() : {},
  ],
  preview: {
    port: 8080,
  },
  server: {
    host: '0.0.0.0',
    port: 8080,
    watch: {
      ignored: [
        '**/node_modules/**',
        '**/subway/**',
        '**/.pnpm-store/**',
        '**/playwright-report/**',
      ],
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        additionalData: `@use "${path.resolve(__dirname, './src/scss/setup/all.scss')}" as *;`,
      },
    },
  },
  logLevel: 'error',
  optimizeDeps: {
    include: [
      'vue-select',
      'vue-star-rating',
      'vue-draggable-resizable',
      // Vuetify auto-import deps discovered mid test run trigger a reload
      // that kills in-flight test file imports. If vitest warns "Vite
      // unexpectedly reloaded a test", add the dep it names here.
      // (A vuetify/components/* glob breaks on css-less stubs.)
      'vuetify/components/VAutocomplete',
      'vuetify/components/VDatePicker',
      'vuetify/components/VMenu',
      'vuetify/components/VProgressLinear',
      'vuetify/components/VSelect',
      'vuetify/components/VTextField',
      'vuetify/directives',
    ],
  },
  test: {
    globals: true,
    exclude: ['**/tests/e2e/**', '**/node_modules/**'],
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          setupFiles: ['tests/browser/setup.ts'],
          include: [
            'tests/unit/**/*.{test,spec}.{js,ts}',
            'tests/browser/**/*.{test,spec}.{js,ts}',
          ],
          browser: {
            enabled: true,
            provider: playwright(),
            headless: true,
            instances: [{ browser: 'chromium' }],
            screenshotFailures: false,
          },
        },
      },
    ],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id
              .toString()
              .split('node_modules/')[1]
              .split('/')[0]
              .toString()
          }
        },
      },
    },
  },
})
