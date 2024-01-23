import vue from '@vitejs/plugin-vue2'
import { createSvgPlugin } from 'vite-plugin-vue2-svg'
import path from 'path'

export default {
  plugins: [vue(), createSvgPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/scss/setup/all.scss";`,
      },
    },
  },
  define: {
    'process.env': process.env,
  },
}
