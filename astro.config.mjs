import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://jabalpuriya.com',
  integrations: [tailwind()],
  compressHTML: true,
  build: {
    format: 'directory'
  }
});
