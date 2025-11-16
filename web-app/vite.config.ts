import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, mkdirSync } from 'fs'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-pdf-worker',
      apply: 'build',
      generateBundle() {
        const src = resolve(__dirname, 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs')
        const dest = resolve(__dirname, 'dist/pdf.worker.min.mjs')
        mkdirSync(resolve(__dirname, 'dist'), { recursive: true })
        copyFileSync(src, dest)
      }
    }
  ]
})
