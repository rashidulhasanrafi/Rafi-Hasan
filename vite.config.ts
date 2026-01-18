import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, path.resolve(), '');
  
  // Prioritize system environment variable (Netlify) over .env file
  // This ensures the key set in Netlify UI is used during the build
  const apiKey = process.env.API_KEY || env.API_KEY;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(),
      },
    },
    define: {
      // This maps the Netlify environment variable API_KEY to process.env.API_KEY
      // ensuring the code adheres to the Gemini SDK requirements.
      'process.env.API_KEY': JSON.stringify(apiKey || ''),
    },
    build: {
      outDir: 'dist',
    }
  };
});