import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  define: {
    // Vite does not expose process.env to the client by default.
    // This line replaces instances of process.env.API_KEY in the code
    // with the actual environment variable value at build time.
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  }
});