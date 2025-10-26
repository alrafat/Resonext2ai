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
    // The API_KEY is injected by the execution environment (e.g., Google AI Studio, Vercel).
    // No explicit 'define' block is needed here.
  };
});