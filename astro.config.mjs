// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://everestbasecamptrekguide.com',
  // WordPress URLs end with a slash: keep every URL identical (/slug/)
  trailingSlash: 'always',
  build: { format: 'directory' },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/search/'),
    }),
  ],
});
