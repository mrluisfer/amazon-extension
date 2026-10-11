import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // The privacy policy must name a real contact: never ship production without one.
  if (process.env.VERCEL_ENV === 'production' && !env.VITE_CONTACT_EMAIL) {
    throw new Error('VITE_CONTACT_EMAIL is required for production builds');
  }
  return { plugins: [tailwindcss(), reactRouter()] };
});
