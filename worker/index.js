// Tiny Worker in front of the static site. It runs only for the paths in wrangler.jsonc run_worker_first:
// - "/": old WordPress query URLs (?p=83, ?page_id=187, ?attachment_id=485, ?cat=, ?tag=, ?s=, ?feed=)
//   become one 301 hop to the matching page;
// - /wp-includes/*: the hacked WordPress served spam doorway pages under /wp-includes/pages/?…; they are gone
//   for good, so 410 with X-Robots-Tag: noindex (any slug, including ones not yet seen);
// - *.pagespeed.*: file names rewritten by the old server's mod_pagespeed (name.jpg.pagespeed.ce.HASH.jpg,
//   also with an x or WxHx prefix) get a 301 to the original file if it still exists, otherwise 410.
// Everything else is served straight from static assets.
import legacy from '../src/data/legacy.json';

const posts = legacy.ids; // WordPress post/page ID → slug
const attachments = Object.fromEntries(legacy.attachments.map((a) => [String(a.id), posts[String(a.parent)]]));
const cats = Object.fromEntries(legacy.categories.map((c) => [String(c.id), c.count > 0 ? c.slug : null]));
const tags = new Set(legacy.tags.filter((t) => t.count > 0).map((t) => t.slug));

const GONE = /^\/wp-includes(\/|$)/i;
const PAGESPEED = /^(.*\/)([^/]+?)\.pagespeed\.[a-z]{2}\.[\w-]+\.[a-z0-9]+$/i;

function gone() {
  return new Response('410 Gone\n', {
    status: 410,
    headers: { 'content-type': 'text/plain; charset=utf-8', 'x-robots-tag': 'noindex', 'cache-control': 'public, max-age=86400' },
  });
}

async function pagespeed(url, env) {
  const m = url.pathname.match(PAGESPEED);
  if (!m) return null;
  const [, dir, name] = m;
  const prefixed = name.match(/^(?:\d+x\d+)?x(.+)$/); // xName.jpg or 620x415xName.jpg
  for (const candidate of prefixed ? [prefixed[1], name] : [name]) {
    const target = new URL(dir + candidate, url.origin);
    const res = await env.ASSETS.fetch(new Request(target, { method: 'HEAD' }));
    if (res.status === 200) return Response.redirect(target.toString(), 301);
  }
  return gone();
}

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
    if (GONE.test(url.pathname)) return gone();
    const ps = await pagespeed(url, env);
    if (ps) return ps;
    if (url.pathname === '/' && url.search) {
      const to = target(url.searchParams);
      if (to) return Response.redirect(new URL(to, url.origin).toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
