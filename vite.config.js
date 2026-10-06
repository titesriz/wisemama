import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Lets the dev server accept requests tunneled through ngrok (free tier
    // hands out a new random subdomain on each launch) for remote testing.
    allowedHosts: ['.ngrok-free.dev', '.ngrok-free.app'],
  },
});
