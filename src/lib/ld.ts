import type { Post } from './site';
import { SITE_NAME, HUB_INFO } from './site';

export function articleLd(post: Post, site: URL) {
  const url = new URL(`/${post.id}/`, site).href;
  const d = post.data;
  const hub = HUB_INFO[d.hub];
  return [
    {
      '@context': 'https://schema.org',
      '@type': d.type === 'page' ? 'WebPage' : 'BlogPosting',
      headline: d.title,
      description: d.description,
      datePublished: d.pubDate.toISOString().slice(0, 10),
      dateModified: d.updatedDate.toISOString().slice(0, 10),
      author: { '@type': 'Person', name: 'Alberts', url: new URL('/author/alberts/', site).href },
      publisher: { '@type': 'Organization', name: SITE_NAME, url: site.href },
      mainEntityOfPage: url,
      url,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site.href },
        { '@type': 'ListItem', position: 2, name: hub.nav, item: new URL(`/${d.hub}/`, site).href },
        { '@type': 'ListItem', position: 3, name: d.title, item: url },
      ],
    },
  ];
}
