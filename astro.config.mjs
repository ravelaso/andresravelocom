// @ts-check
import { defineConfig } from 'astro/config';

import cloudflare from '@astrojs/cloudflare';

import react from '@astrojs/react';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "compile",
  }),
  integrations: [react()],
  vite: {
      resolve: {
          // Use react-dom/server.edge instead of react-dom/server.browser for React 19.
          // This avoids SSR/runtime issues on Cloudflare workerd.
          alias: {
              "react-dom/server": "react-dom/server.edge",
          },
      },
      plugins: [tailwindcss()]
  }
});