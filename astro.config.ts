import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { adminIo } from './src/integrations/admin-io';

export default defineConfig({
  output: "server",
  adapter: cloudflare({
    imageService: "compile",
  }),
  integrations: [react(), adminIo()],
  vite: {
      server: {
          watch: {
              ignored: ['**/src/data/**'],
          },
      },
      resolve: {
          alias: {
              "react-dom/server": "react-dom/server.edge",
          },
      },
      plugins: [tailwindcss()]
  }
});
