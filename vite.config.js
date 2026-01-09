import { defineConfig, defineProject } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import path from 'path'
import vueDevTools from 'vite-plugin-vue-devtools'
import { playwright } from '@vitest/browser-playwright'

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
        ],
      },
    }),
    ...(!process.env.VITEST ? [vueDevTools()] : []),
  ],
  preview: {
    port: 8080,
  },
  server: {
    port: 8080,
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
    include: ['vue-select', 'vue-star-rating', 'vue-draggable-resizable'],
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
          },
        },
      },
    ],
  },
})
