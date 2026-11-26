import type { ImageMetadata } from 'astro';

const files = import.meta.glob<ImageMetadata>('/src/content/posts/*/*.{jpg,jpeg,png,JPG,JPEG,PNG}', { eager: true, import: 'default' });

export interface Shot { heading: string; images: { src: ImageMetadata; alt: string; full?: string }[]; paras: string[] }

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export function inline(md: string): string {
  return esc(md)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\\([\\`*_{}\[\]()#+\-.!])/g, '$1');
}

/** Split a gallery post body (## heading + image + optional text) into sections, keeping the original order and words. */
export function parseGallery(slug: string, body = ''): { intro: string[]; shots: Shot[]; closing: string[] } {
  const intro: string[] = [];
  const closing: string[] = [];
  const shots: Shot[] = [];
  const imgRe = /^\[?!\[([^\]]*)\]\(\.\/([^)\s]+)(?:\s+"[^"]*")?\)(?:\]\(([^)]+)\))?$/;
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    if (line.startsWith('## ')) { shots.push({ heading: line.slice(3), images: [], paras: [] }); continue; }
    const m = line.match(imgRe);
    const cur = shots[shots.length - 1];
    if (m) {
      const src = files[`/src/content/posts/${slug}/${m[2]}`];
      if (!src) throw new Error(`Missing image ${slug}/${m[2]}`);
      cur?.images.push({ src, alt: m[1], full: m[3] });
      continue;
    }
    if (/^\*All pictures .*\*$/.test(line)) { closing.push(line); continue; }
    (cur ? cur.paras : intro).push(line);
  }
  return { intro, shots, closing };
}
