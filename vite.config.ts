import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// FIX: Import 'process' to provide correct TypeScript types for process.cwd().
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    build: {
      outDir: 'build',
    },
    // Vercel (and other platforms) provides environment variables during the build process.
    // This `define` block makes the API_KEY available on `process.env` in the client-side code
    // by replacing `process.env.API_KEY` with its value at build time.
    // Make sure you have set the API_KEY environment variable in your Vercel project settings.
    define: {
        'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
    }
  };
});