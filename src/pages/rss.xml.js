import rss from '@astrojs/rss';
import { allPosts, SITE_NAME } from '../lib/site';

export async function GET(context) {
  const posts = (await allPosts()).filter((p) => p.data.type === 'post');
  return rss({
    title: SITE_NAME,
    description: 'Independent notes on the Everest Base Camp trek.',
    site: context.site,
    trailingSlash: true,
    items: posts.map((p) => ({ title: p.data.title, description: p.data.description, pubDate: p.data.pubDate, link: `/${p.id}/` })),
  });
}
