import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // GitHub Pages デプロイ用: リポジトリ名をbaseに設定
  // https://vitejs.dev/guide/static-deploy.html#github-pages
  base: '/fhir-poc/',
  plugins: [
    react(),
    tailwindcss(),
  ],
})
