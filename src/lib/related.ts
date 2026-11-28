// "Related" links for articles and galleries, computed once for the whole site.
// Score = shared tags + shared categories (2 each, 1 for the broad ones) + same hub. Ties go to the article
// that has been picked least so far, so no article is left out and no page is without related links.
import type { Post } from './site';

const BROAD = new Set(['trekking-in-nepal', 'trekking-basics', 'everest-base-camp-trek']);

function score(a: Post, b: Post): number {
  const tags = a.data.tags.filter((t) => b.data.tags.includes(t)).length;
  const cats = a.data.categories.filter((c) => b.data.categories.includes(c)).reduce((s, c) => s + (BROAD.has(c) ? 1 : 2), 0);
  return tags + cats + (a.data.hub === b.data.hub ? 1 : 0);
}

export function relatedMap(posts: Post[], perArticle = 4, perGallery = 2): Map<string, Post[]> {
  const articles = posts.filter((p) => p.data.layout === 'article');
  const picked = new Map(articles.map((a) => [a.id, 0]));
  const out = new Map<string, Post[]>();
  for (const p of posts) {
    const n = p.data.layout === 'gallery' ? perGallery : perArticle;
    const list = articles
      .filter((a) => a.id !== p.id)
      .map((a) => ({ a, s: score(p, a) }))
      .sort((x, y) => y.s - x.s || picked.get(x.a.id)! - picked.get(y.a.id)! || y.a.data.pubDate.getTime() - x.a.data.pubDate.getTime())
      .slice(0, n)
      .map((x) => x.a);
    list.forEach((a) => picked.set(a.id, picked.get(a.id)! + 1));
    out.set(p.id, list);
  }
  return out;
}
