import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Production site: https://visafreely.com/ (GitHub Pages + custom domain)
export default defineConfig({
  site: 'https://visafreely.com',
  base: '/',
  trailingSlash: 'always',
  integrations: [sitemap()],
});
