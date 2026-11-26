import { getCollection, type CollectionEntry } from 'astro:content';
import legacy from '../data/legacy.json';

export const SITE_NAME = 'Everest Base Camp Trek Guide';
export const GA4_ID = 'G-X2Q7PW73K2';
export const ADSENSE_CLIENT = 'ca-pub-8784828100627586';
export const PROD_HOST = 'everestbasecamptrekguide.com';

export type Post = CollectionEntry<'posts'>;

export const HUB_INFO: Record<string, { nav: string; title: string; blurb: string; description: string }> = {
  'everest-base-camp-trek': { nav: 'Start here', title: 'Start here: the EBC trek', blurb: 'Route, days and where you sleep, on one page.', description: 'Start here for the Everest Base Camp trek: Lukla, acclimatization, lodges, food, water and internet, from first-hand notes on the trail.' },
  'trekking-basics': { nav: 'Planning', title: 'Lodges, Lukla & logistics', blurb: 'Teahouses, the Lukla flight, seasons, internet.', description: 'Trekking basics for Nepal: when to go, how long to trek, lodges and camping, organized or independent treks, and the flight to Lukla.' },
  'altitude-sickness': { nav: 'Altitude', title: 'Altitude & acclimatization', blurb: 'How to go up slowly, and what to watch for.', description: 'Altitude on the Everest Base Camp trek: how to acclimatize, and the warning signs of AMS, HAPE and HACE.' },
  'trekking-food': { nav: 'Food & water', title: 'Eating & drinking on the trail', blurb: 'Dal bhat, tsampa, lodge menus and safe water.', description: 'Food and water on the Everest Base Camp trek: lodge menus, dal bhat and garlic soup, what to bring from home, and drinking enough.' },
  'everest-trekking-pictures': { nav: 'Photos', title: 'Pictures from the Khumbu', blurb: 'Gokyo Ri, Kala Patthar, Mani Rimdu.', description: 'Photos from the Everest region: Kala Patthar, Gokyo Ri, the Mani Rimdu festival at Tengboche and the high passes of the Khumbu.' },
};

export const categories = legacy.categories.filter((c) => c.count > 0);
export const tags = legacy.tags.filter((t) => t.count > 0);

export async function allPosts(): Promise<Post[]> {
  const list = await getCollection('posts', ({ data }) => !data.draft);
  return list.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Posts listed on a category archive: WordPress membership, plus the gallery page in the photos hub. */
export function inCategory(posts: Post[], slug: string): Post[] {
  return posts.filter((p) => p.data.categories.includes(slug) || (p.data.type === 'page' && p.data.hub === slug));
}

export function inTag(posts: Post[], slug: string): Post[] {
  return posts.filter((p) => p.data.tags.includes(slug));
}

export const fmtMonth = (d: Date) => d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
export const fmtDay = (d: Date) => d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

export function readingMinutes(body = ''): number {
  const words = body.replace(/!\[[^\]]*\]\([^)]*\)/g, '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

export function imageCount(body = ''): number {
  return (body.match(/!\[[^\]]*\]\(/g) || []).length;
}

export function postMeta(p: Post): string {
  return p.data.layout === 'gallery'
    ? `${fmtMonth(p.data.pubDate)}, ${imageCount(p.body)} photos`
    : `${fmtMonth(p.data.pubDate)}, ${readingMinutes(p.body)} min read`;
}

/** Meta description for category/tag archives: unique per page, built from the posts it lists. */
export function listDescription(name: string, posts: Post[]): string {
  const n = posts.length;
  const titles = posts.slice(0, 2).map((p) => p.data.title);
  let s = `${name} on Everest Base Camp Trek Guide: ${n} ${n === 1 ? 'article' : 'articles'}, including ${titles.join(' and ')}.`;
  if (s.length > 158) s = `${name} on Everest Base Camp Trek Guide: ${n} ${n === 1 ? 'article' : 'articles'}, including ${titles[0]}.`;
  if (s.length > 158) s = s.slice(0, 155).replace(/\s+\S*$/, '') + '…';
  return s;
}
