import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Production site: https://visafreely.com/ (GitHub Pages + custom domain)
export default defineConfig({
  site: 'https://visafreely.com',
  base: '/',
  trailingSlash: 'always',
  integrations: [
    // /embed/ is the iframe widget document — chrome-light and noindex, kept out
    // of the sitemap so it does not compete as a thin page. /widget/ stays in.
    sitemap({ filter: (page) => !page.endsWith('/embed/') }),
  ],
});
