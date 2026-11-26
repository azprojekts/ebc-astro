"""Export everestbasecamptrekguide.com WordPress content 1:1 into Astro content collection.

Usage: python3 -I export_wp.py RAW_DIR PAGES_DIR MEDIA_CACHE REPO_DIR
- RAW_DIR: REST JSON (posts, pages, categories, tags, media)
- PAGES_DIR: rendered single-post HTML (for Thesis lead images) + ../idx.txt
- MEDIA_CACHE: where original images are downloaded
- REPO_DIR: Astro repo root
"""
import html, json, os, re, shutil, subprocess, sys, urllib.parse
from pathlib import Path

import yaml
from markdownify import markdownify as md

RAW, PAGES, CACHE, REPO = map(Path, sys.argv[1:5])
SITE = 'everestbasecamptrekguide.com'
POSTS_OUT = REPO / 'src/content/posts'
PUBLIC = REPO / 'public'

def load(name):
    return json.loads((RAW / name).read_text())

posts = load('posts_per_page_100.json')
pages = load('pages_per_page_100.json')
cats = {c['id']: c for c in load('categories_per_page_100.json')}
tags = {t['id']: t for t in load('tags_per_page_100_page_1.json') + load('tags_per_page_100_page_2.json')}
media = load('media_per_page_100.json')

# Thesis lead image per post URL
lead = {}
idx = (PAGES.parent / 'idx.txt').read_text().split('\n')
for line in idx:
    if not line.strip():
        continue
    n, url = line.split()
    h = (PAGES / f'{n}.html').read_text(errors='replace')
    m = re.search(r'<img[^>]*class="post_image[^"]*"[^>]*src="([^"]+)"|<img[^>]*src="([^"]+)"[^>]*class="post_image', h)
    if m:
        lead[url.rstrip('/').split('/')[-1]] = m.group(1) or m.group(2)

def fetch(url):
    """Download original to cache, return local path. Uses https."""
    u = urllib.parse.urlsplit(url)
    path = u.path
    dest = CACHE / path.lstrip('/')
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        r = subprocess.run(['curl', '-s', '-f', '-o', str(dest), f'https://{SITE}{path}'])
        if r.returncode != 0:
            raise SystemExit(f'download failed: {url}')
    return path, dest

def mirror(path, src):
    """Keep legacy URL alive: copy original to public/<path>."""
    dst = PUBLIC / path.lstrip('/')
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

def clean(body):
    body = re.sub(r'<script\b.*?</script>', '', body, flags=re.S | re.I)
    body = re.sub(r'<div id="(?:midpostad|endpostad)">\s*</div>', '', body)
    body = re.sub(r'<div id="(?:midpostad|endpostad)">(.*?)</div>', r'\1', body, flags=re.S)
    body = body.replace('<!--more-->', '')
    body = re.sub(r'<span>\s*</span>', '', body)
    body = re.sub(r'<p>\s*(?:<br\s*/?>\s*)*</p>', '', body)
    return body

def convert(item, folder):
    body = clean(item['content']['rendered'])
    images = []

    def img_sub(m):
        tag = m.group(0)
        src = re.search(r'src="([^"]+)"', tag).group(1)
        alt = html.unescape((re.search(r'alt="([^"]*)"', tag) or [None, ''])[1])
        title = html.unescape((re.search(r'title="([^"]*)"', tag) or [None, ''])[1])
        path, local = fetch(src)
        mirror(path, local)
        name = os.path.basename(path)
        shutil.copy2(local, folder / name)
        images.append(name)
        t = f' title="{html.escape(title)}"' if title and title != alt else ''
        return f'<img src="./{name}" alt="{html.escape(alt)}"{t}>'

    body = re.sub(r'<img\b[^>]*>', img_sub, body)
    # links to full-size image files stay on their legacy URL (mirrored in public/)
    for href in re.findall(r'href="(https?://' + re.escape(SITE) + r'/wp-content/[^"]+)"', body):
        path, local = fetch(href)
        mirror(path, local)
    body = re.sub(r'https?://(?:www\.)?' + re.escape(SITE) + r'(/[^"\s]*)', r'\1', body)
    # named anchors (#1st-altitude-acclimatization-rule ...) must survive conversion
    body = re.sub(r'<a name="([^"]+)">\s*</a>', r'ANCHORTOKEN[\1]', body)
    text = md(body, heading_style='ATX', bullets='-', escape_underscores=False)
    text = re.sub(r'ANCHORTOKEN\[([^\]]+)\]', r'<a id="\1"></a>', text)
    text = re.sub(r'\n{3,}', '\n\n', text).strip() + '\n'
    return text, images

def describe(item):
    ex = html.unescape(re.sub(r'<[^>]+>', ' ', item['excerpt']['rendered']))
    ex = re.sub(r'\s+', ' ', ex.replace('→', ' ')).strip()
    ex = re.sub(r'\[(?:&hellip;|…)\]|Continue reading.*$', '', ex).strip()
    if len(ex) > 158:
        ex = ex[:155].rsplit(' ', 1)[0].rstrip(',;:') + '…'
    return ex

HUB = {  # primary hub per legacy id (design: 5 hubs)
    83: 'altitude-sickness', 94: 'altitude-sickness',
    309: 'trekking-food', 289: 'trekking-food', 292: 'trekking-food', 318: 'trekking-food', 298: 'trekking-food',
    33: 'trekking-basics', 69: 'trekking-basics', 12: 'trekking-basics', 132: 'trekking-basics', 30: 'trekking-basics',
    51: 'trekking-basics', 20: 'trekking-basics', 27: 'trekking-basics', 22: 'trekking-basics',
    495: 'everest-trekking-pictures', 484: 'everest-trekking-pictures', 467: 'everest-trekking-pictures',
    187: 'everest-trekking-pictures',
}
MEDICAL = {83, 94}

if POSTS_OUT.exists():
    shutil.rmtree(POSTS_OUT)
inventory = []
for item, kind in [(p, 'post') for p in posts] + [(p, 'page') for p in pages]:
    slug = item['slug']
    folder = POSTS_OUT / slug
    folder.mkdir(parents=True, exist_ok=True)
    text, images = convert(item, folder)
    gallery = kind == 'page' or any(cats[c]['slug'] == 'everest-trekking-pictures' for c in item.get('categories', []))
    fm = {
        'title': html.unescape(item['title']['rendered']),
        'description': describe(item),
        'pubDate': item['date'][:10],
        'updatedDate': item['modified'][:10],
        'type': kind,
        'layout': 'gallery' if gallery else 'article',
        'hub': HUB[item['id']],
        'categories': [cats[c]['slug'] for c in item.get('categories', [])],
        'tags': [tags[t]['slug'] for t in item.get('tags', [])],
        'notice': 'medical' if item['id'] in MEDICAL else ('none' if gallery else 'archived'),
        'legacy': {'wpId': item['id']},
    }
    if slug in lead:
        path, local = fetch(lead[slug])
        mirror(path, local)
        name = 'lead-' + os.path.basename(path)
        shutil.copy2(local, folder / name)
        fm['cover'] = './' + name
    elif images:
        fm['cover'] = './' + images[0]
    fm_yaml = yaml.safe_dump(fm, sort_keys=False, allow_unicode=True, width=1000)
    (folder / 'index.md').write_text(f'---\n{fm_yaml}---\n\n{text}')
    inventory.append({'id': item['id'], 'slug': slug, 'kind': kind, 'images': len(images),
                      'words': len(re.sub(r'<[^>]+>', ' ', item['content']['rendered']).split())})

# all 54 media originals + attachment pages (for redirects)
attachments = []
for m in media:
    src = m['source_url']
    path, local = fetch(src)
    mirror(path, local)
    attachments.append({'attachment': urllib.parse.urlsplit(m['link']).path, 'parent': m['post']})

# categories + taxonomy data for archive pages
taxo = {
    'categories': [{'slug': c['slug'], 'name': html.unescape(c['name']), 'description': c['description'], 'count': c['count']}
                   for c in cats.values()],
    'tags': [{'slug': t['slug'], 'name': html.unescape(t['name']), 'count': t['count']} for t in tags.values()],
    'attachments': attachments,
    'ids': {str(i['id']): i['slug'] for i in inventory},
}
(REPO / 'src/data').mkdir(parents=True, exist_ok=True)
(REPO / 'src/data/legacy.json').write_text(json.dumps(taxo, indent=1, ensure_ascii=False))
print(json.dumps(inventory, indent=0))
print('lead images:', len(lead), '| media:', len(media))
