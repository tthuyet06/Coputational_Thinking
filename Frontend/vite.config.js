// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // THÊM DÒNG NÀY: Dùng đường dẫn tương đối
  base: './', // hoặc bạn có thể dùng một đường dẫn cụ thể nếu muốn, nhưng './' là an toàn nhất khi embed
})