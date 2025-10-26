import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
  },
  // Manually define process.env variables to make them available in the client-side code.
  // This is necessary because the Vercel environment variables are not prefixed with VITE_.
  define: {
    'process.env.SUPABASE_URL': JSON.stringify(process.env.SUPABASE_URL),
    'process.env.SUPABASE_ANON_KEY': JSON.stringify(process.env.SUPABASE_ANON_KEY),
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY),
  },
});