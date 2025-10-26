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
    // REMOVED: The 'define' block for process.env.API_KEY is no longer needed
    // as the API key will be handled securely in a serverless function.
  };
});
