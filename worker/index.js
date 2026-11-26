// Tiny Worker in front of the static site: only runs for "/" (see wrangler.jsonc run_worker_first)
// and turns old WordPress query URLs (?p=83, ?page_id=187, ?attachment_id=485, ?cat=, ?tag=, ?s=, ?feed=)
// into one 301 hop to the matching page. Everything else is served straight from static assets.
import legacy from '../src/data/legacy.json';

const posts = legacy.ids; // WordPress post/page ID → slug
const attachments = Object.fromEntries(legacy.attachments.map((a) => [String(a.id), posts[String(a.parent)]]));
const cats = Object.fromEntries(legacy.categories.map((c) => [String(c.id), c.count > 0 ? c.slug : null]));
const tags = new Set(legacy.tags.filter((t) => t.count > 0).map((t) => t.slug));

function target(q) {
  const p = q.get('p') ?? q.get('page_id');
  if (p) return posts[p] ? `/${posts[p]}/` : '/';
  const att = q.get('attachment_id');
  if (att) return attachments[att] ? `/${attachments[att]}/` : '/';
  const cat = q.get('cat');
  if (cat) return cats[cat] ? `/${cats[cat]}/` : '/';
  const tag = q.get('tag');
  if (tag) return tags.has(tag) ? `/tag/${tag}/` : '/';
  if (q.has('s')) return q.get('s') ? `/search/?q=${encodeURIComponent(q.get('s'))}` : '/search/';
  if (q.has('feed')) return '/rss.xml';
  if (q.has('author')) return '/author/alberts/';
  if (q.has('m')) return '/';
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/' && url.search) {
      const to = target(url.searchParams);
      if (to) return Response.redirect(new URL(to, url.origin).toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
