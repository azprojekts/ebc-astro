// JSON-LD (schema.org) for every page type. Shared entities carry an @id and are repeated in each page's
// @graph, so every reference resolves inside the page that uses it.
import type { Post } from './site';
import { SITE_NAME, HUB_INFO, AUTHOR_BIO_SHORT } from './site';

const CONTEXT = 'https://schema.org';
const LANG = 'en-US';
const SITE_DESCRIPTION =
  'All about the Everest Base Camp trek in Nepal: how to prepare, altitude, routes, guides and porters, lodges, food and the flight to Lukla.';

const abs = (path: string, site: URL) => new URL(path, site).href;
// Full ISO 8601 datetime with a time zone, as Google's Article checks expect (dates are UTC midnight).
const day = (d: Date) => d.toISOString().replace(/\.\d{3}Z$/, '+00:00');

export const ldIds = (site: URL) => ({
  org: abs('/#organization', site),
  website: abs('/#website', site),
  person: abs('/author/alberts/#person', site),
});

export function organizationNode(site: URL) {
  return {
    '@type': 'Organization',
    '@id': ldIds(site).org,
    name: SITE_NAME,
    url: site.href,
    logo: { '@type': 'ImageObject', url: abs('/img/logo-512.png', site), width: 512, height: 512 },
    email: 'guide@everestbasecamptrekguide.com',
    description: SITE_DESCRIPTION,
  };
}

export function websiteNode(site: URL) {
  return {
    '@type': 'WebSite',
    '@id': ldIds(site).website,
    name: SITE_NAME,
    url: site.href,
    inLanguage: LANG,
    publisher: { '@id': ldIds(site).org },
  };
}

export function personNode(site: URL) {
  return { '@type': 'Person', '@id': ldIds(site).person, name: 'Alberts', url: abs('/author/alberts/', site), description: AUTHOR_BIO_SHORT };
}

function breadcrumbNode(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

/** Start page: Organization + WebSite. */
export function homeLd(site: URL) {
  return { '@context': CONTEXT, '@graph': [organizationNode(site), websiteNode(site)] };
}

/** Articles and photo galleries (the /himalayas-pictures/ page included). */
export function articleLd(post: Post, site: URL, imageUrl?: string) {
  const url = abs(`/${post.id}/`, site);
  const d = post.data;
  const hub = HUB_INFO[d.hub];
  const ids = ldIds(site);
  const modified = d.updatedDate.getTime() > d.pubDate.getTime() ? day(d.updatedDate) : undefined;
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'BlogPosting',
        '@id': `${url}#article`,
        headline: d.title,
        description: d.description,
        ...(imageUrl ? { image: [imageUrl] } : {}),
        datePublished: day(d.pubDate),
        ...(modified ? { dateModified: modified } : {}),
        author: { '@id': ids.person },
        publisher: { '@id': ids.org },
        isPartOf: { '@id': ids.website },
        mainEntityOfPage: url,
        url,
        inLanguage: LANG,
        articleSection: hub.nav,
      },
      personNode(site),
      organizationNode(site),
      websiteNode(site),
      breadcrumbNode([
        { name: 'Home', url: site.href },
        { name: hub.nav, url: abs(`/${d.hub}/`, site) },
        { name: d.title, url },
      ]),
    ],
  };
}

/** Archive pages (hubs, categories, tags, /articles/): CollectionPage with the listed posts. */
export function collectionLd(site: URL, path: string, name: string, description: string | undefined, posts: Post[]) {
  const url = abs(path, site);
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${url}#page`,
        url,
        name,
        ...(description ? { description } : {}),
        inLanguage: LANG,
        isPartOf: { '@id': ldIds(site).website },
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: posts.length,
          itemListElement: posts.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`/${p.id}/`, site), name: p.data.title })),
        },
      },
      websiteNode(site),
      organizationNode(site),
      breadcrumbNode([
        { name: 'Home', url: site.href },
        { name, url },
      ]),
    ],
  };
}

/** Author page: ProfilePage about the Person. */
export function profileLd(site: URL, description?: string) {
  const url = abs('/author/alberts/', site);
  return {
    '@context': CONTEXT,
    '@graph': [
      {
        '@type': 'ProfilePage',
        '@id': `${url}#page`,
        url,
        name: 'Alberts',
        ...(description ? { description } : {}),
        inLanguage: LANG,
        isPartOf: { '@id': ldIds(site).website },
        mainEntity: { '@id': ldIds(site).person },
      },
      personNode(site),
      websiteNode(site),
      organizationNode(site),
      breadcrumbNode([
        { name: 'Home', url: site.href },
        { name: 'Alberts', url },
      ]),
    ],
  };
}
