import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import path from 'path'

export default {
  envPrefix: 'VUE_',
  define: {
    'import.meta.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'import.meta.env.SUBWAY_CUSTOM_VOLUNTEER_PARTNER_ORGS': JSON.stringify(
      process.env.SUBWAY_CUSTOM_VOLUNTEER_PARTNER_ORGS
    ),
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
                cleanupIds: false,
              },
            },
          },
        ],
      },
    }),
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
        additionalData: `@import "./src/scss/setup/all.scss";`,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['/tests/setup.js'],
    exclude: ['**/tests/e2e/**', '**/node_modules/**'],
    server: {
      deps: {
        inline: [/maz-ui.*/],
      },
    },
  },
}
