import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
// FIX: Import 'process' to provide correct TypeScript types for process.cwd().
import process from 'process';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env variables from .env files and the environment
  // The third parameter '' allows loading all variables, not just VITE_ prefixed ones.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    build: {
      outDir: 'build',
    },
    // This 'define' block makes environment variables available to the client-side code.
    // It replaces any occurrence of `process.env.API_KEY` in the code with the value
    // of the API_KEY environment variable at build time.
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});
