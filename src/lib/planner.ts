// Acclimatization planner: stops on the EBC trail, day hikes, starting itineraries, the pace checks,
// and the HTML/SVG the page renders (same functions at build time and in the browser).
//
// Guidelines (checked 26 Nov 2026):
// - CDC Yellow Book 2026, "High-Altitude Travel and Altitude Illness" (Hackett & Shlim): avoid a sleeping
//   altitude of 2,750 m or more in a single day; above 3,000 m sleep at most 500 m higher each night and plan an
//   extra day of acclimatization for every additional 1,000 m of sleeping altitude.
// - Wilderness Medical Society, 2024 update (Luks et al.): a rest day (no ascent to a higher sleeping altitude)
//   every 3–4 days above 3,000 m.
// - UK NaTHNaC (TravelHealthPro): where a larger gain can't be avoided, rest before or after it, and keep the
//   average over the ascent below 500 m a day.
//
// Altitudes: as in route.ts; the extra stops (Monjo, Khumjung, Deboche, Pangboche, Chhukung, Thukla) as most
// 2026 itineraries list them. Published figures differ by 20–100 m.
import { fmt, LAST_CHECKED } from './route';

export { fmt, LAST_CHECKED };

export interface Hike { name: string; alt: number }
export interface Choice { id: string; label: string; hikes: Hike[] }
export interface Stop { id: string; name: string; alt: number; choices?: Choice[] }
export interface PlanDay { s: string; h: string }

export const START = { name: 'Kathmandu', alt: 1400 };
export const MIN_DAYS = 2;
export const MAX_DAYS = 24;
const LINE = 3000;        // above this, the nightly limit applies
const STEP = 500;         // largest nightly gain in sleeping altitude above LINE
const FIRST_NIGHT = 2750; // first night after arriving from low altitude
const RUN = 4;            // this many nights higher in a row means no rest day in 3–4 days

const one = (id: string, name: string, alt: number): Choice => ({ id, label: `${name}, ${fmt(alt)} m`, hikes: [{ name, alt }] });
const EBC: Hike = { name: 'Everest Base Camp', alt: 5364 };
const KP: Hike = { name: 'Kala Patthar', alt: 5644 };

/** In trail order, Lukla to Gorak Shep. Pheriche and Dingboche sit in parallel valleys; Chhukung is a side valley. */
export const STOPS: Stop[] = [
  { id: 'lu', name: 'Lukla', alt: 2860 },
  { id: 'ph', name: 'Phakding', alt: 2610 },
  { id: 'mo', name: 'Monjo', alt: 2835 },
  { id: 'na', name: 'Namche Bazaar', alt: 3440, choices: [one('hev', 'Hotel Everest View', 3880)] },
  { id: 'kj', name: 'Khumjung', alt: 3790 },
  { id: 'te', name: 'Tengboche', alt: 3860 },
  { id: 'de', name: 'Deboche', alt: 3820 },
  { id: 'pa', name: 'Pangboche', alt: 3985 },
  { id: 'pr', name: 'Pheriche', alt: 4371 },
  { id: 'di', name: 'Dingboche', alt: 4410, choices: [one('nk', 'Nangkartshang', 5083)] },
  { id: 'ch', name: 'Chhukung', alt: 4730, choices: [one('cr', 'Chhukung Ri', 5550)] },
  { id: 'tu', name: 'Thukla', alt: 4620 },
  { id: 'lo', name: 'Lobuche', alt: 4940 },
  { id: 'gs', name: 'Gorak Shep', alt: 5164, choices: [
    { id: 'ebc', label: `Everest Base Camp, ${fmt(EBC.alt)} m`, hikes: [EBC] },
    { id: 'kp', label: `Kala Patthar, ${fmt(KP.alt)} m`, hikes: [KP] },
    { id: 'both', label: 'Base Camp and Kala Patthar', hikes: [EBC, KP] },
  ] },
];
const BY_ID: Record<string, Stop> = Object.fromEntries(STOPS.map((s) => [s.id, s]));

/** Day hikes on offer: from where you woke up or from where you sleep (Kala Patthar at dawn, then down). */
export function choicesFor(prev: string | null, stop: string): Choice[] {
  const out: Choice[] = [];
  for (const id of [prev, stop]) for (const c of (id && BY_ID[id]?.choices) || []) if (!out.some((o) => o.id === c.id)) out.push(c);
  return out;
}

export const encode = (plan: PlanDay[]) => plan.map((d) => (d.h ? `${d.s}-${d.h}` : d.s)).join('.');

/** Parse "lu.ph.na.na-hev…"; unknown stops make the whole plan invalid, unknown hikes are dropped. */
export function decode(str: string): PlanDay[] | null {
  const parts = str.split('.').filter(Boolean);
  if (parts.length < MIN_DAYS || parts.length > MAX_DAYS) return null;
  const plan: PlanDay[] = [];
  for (const p of parts) {
    const [s, h = ''] = p.split('-');
    if (!BY_ID[s]) return null;
    const prev = plan.length ? plan[plan.length - 1].s : null;
    plan.push({ s, h: choicesFor(prev, s).some((c) => c.id === h) ? h : '' });
  }
  return plan;
}

/** After an edit, drop day hikes that are no longer reachable from that day's stops. */
export function tidy(plan: PlanDay[]): PlanDay[] {
  return plan.map((d, i) => ({ s: d.s, h: choicesFor(i ? plan[i - 1].s : null, d.s).some((c) => c.id === d.h) ? d.h : '' }));
}

export const PRESETS: Record<string, { label: string; plan: PlanDay[] }> = {
  classic: { label: 'Classic, 12 days', plan: decode('lu.ph.na.na-hev.te.di.di-nk.lo.gs-ebc.pr-kp.na.lu')! },
  fast: { label: 'Faster, 10 days', plan: decode('ph.na.na-hev.te.di.lo.gs-ebc.pr-kp.na.lu')! },
  slow: { label: 'Slower, 13 days', plan: decode('ph.na.na-hev.kj.pa.di.di-nk.tu.lo.gs-ebc.pr-kp.na.lu')! },
};

export interface DayEval {
  i: number; stop: Stop; prevAlt: number; gain: number;
  choices: Choice[]; choice?: Choice;
  ascent: boolean;  // sleeps higher than the night before
  hold: boolean;    // above 3,000 m and no higher than the night before (a rest day in guideline terms)
  rest: boolean;    // a hold night on the way up, before the highest night
  over: boolean;    // more than +500 m with 3,000 m crossed or exceeded
  covered: boolean; // over, with a hold night right before or after it
  run: number;      // nights higher in a row above 3,000 m, up to and including this one
  high: boolean;    // first night, above 2,750 m
  top: boolean;     // highest night
  warn: boolean;
}
export interface Check { id: string; title: string; state: 'ok' | 'warn' | 'na'; detail: string; source: string }
export interface Evaluation {
  days: DayEval[]; checks: Check[]; issues: number;
  topIdx: number; maxSleep: number; highPoint: Hike; rests: number;
}

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? '' : 's'}`;
const ord = (n: number) => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${fmt(Math.abs(n))} m`;
function list(ds: DayEval[]): string {
  const items = ds.map((d, k) => `${k ? 'day' : 'Day'} ${d.i} to ${d.stop.name} (${signed(d.gain)})`);
  return items.length > 1 ? `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}` : items[0];
}

export function evaluate(plan: PlanDay[]): Evaluation {
  const days: DayEval[] = plan.map((d, i) => {
    const stop = BY_ID[d.s];
    const prevAlt = i ? BY_ID[plan[i - 1].s].alt : START.alt;
    const choices = choicesFor(i ? plan[i - 1].s : null, d.s);
    const gain = stop.alt - prevAlt;
    return {
      i, stop, prevAlt, gain, choices, choice: choices.find((c) => c.id === d.h),
      ascent: gain > 0, hold: i > 0 && gain <= 0 && stop.alt > LINE, rest: false,
      over: gain > STEP && Math.max(prevAlt, stop.alt) > LINE, covered: false, run: 0,
      high: i === 0 && stop.alt > FIRST_NIGHT, top: false, warn: false,
    };
  });
  const maxSleep = Math.max(...days.map((d) => d.stop.alt));
  const topIdx = days.findIndex((d) => d.stop.alt === maxSleep);
  let run = 0;
  for (const d of days) {
    run = d.ascent && d.stop.alt > LINE ? run + 1 : 0;
    d.run = run;
    d.covered = d.over && (!!days[d.i - 1]?.hold || !!days[d.i + 1]?.hold);
    d.rest = d.hold && d.i < topIdx;
    d.top = d.i === topIdx && maxSleep > LINE;
    d.warn = d.high || (d.over && !d.covered) || run >= RUN;
  }
  const rests = days.filter((d) => d.rest).length;
  const top = days[topIdx];
  const highPoint = days.flatMap((d) => [{ name: d.stop.name, alt: d.stop.alt }, ...(d.choice?.hikes ?? [])])
    .reduce((a, h) => (h.alt > a.alt ? h : a));

  const na = maxSleep <= LINE;
  const NA = 'Applies once you sleep above 3,000 m.';
  const checks: Check[] = [];
  const d0 = days[0];
  checks.push({
    id: 'first', title: 'First night below 2,750 m', source: 'CDC',
    state: d0.high ? 'warn' : 'ok',
    detail: `Day 0 ends in ${d0.stop.name} at ${fmt(d0.stop.alt)} m, after the flight from Kathmandu.` + (d0.high
      ? ` Guidelines advise against sleeping above 2,750 m on the day you arrive from low altitude.${d0.stop.id === 'lu' ? ' Walking down to Phakding (2,610 m) the same afternoon solves it.' : ''}`
      : ''),
  });

  const jumps = days.filter((d) => d.over);
  const bad = jumps.filter((d) => !d.covered);
  checks.push({
    id: 'jumps', title: 'Big climbs have a rest day next to them', source: 'CDC, NaTHNaC',
    state: na ? 'na' : bad.length ? 'warn' : 'ok',
    detail: na ? NA
      : !jumps.length ? 'No night is more than 500 m above the one before.'
      : bad.length ? `${list(bad)} ${bad.length === 1 ? 'climbs' : 'climb'} more than 500 m with no rest day before or after. Add a night at the stop before, or split the climb at a lodge in between.`
      : `${list(jumps)} ${jumps.length === 1 ? 'climbs' : 'climb'} more than 500 m, ${jumps.length === 1 ? 'with a rest day' : 'each with a rest day'} before or after.`,
  });

  const need = na ? 0 : Math.floor((maxSleep - LINE) / 1000);
  checks.push({
    id: 'extra', title: 'An extra night for every 1,000 m', source: 'CDC',
    state: na ? 'na' : rests >= need ? 'ok' : 'warn',
    detail: na ? NA
      : need === 0 ? `Your highest night, ${top.stop.name} at ${fmt(maxSleep)} m, is less than 1,000 m above 3,000 m, so this rule asks for no extra night. This plan has ${plural(rests, 'rest day')}.`
      : `Your highest night, ${top.stop.name} at ${fmt(maxSleep)} m, is ${fmt(maxSleep - LINE)} m above 3,000 m. That calls for ${plural(need, 'rest day')} on the way up; this plan has ${rests}.` + (rests < need ? ' Namche Bazaar and Dingboche are the usual places to add one.' : ''),
  });

  const worst = days.reduce((a, d) => (d.run > a.run ? d : a), days[0]);
  checks.push({
    id: 'run', title: 'A rest day every 3–4 days', source: 'WMS',
    state: na ? 'na' : worst.run >= RUN ? 'warn' : 'ok',
    detail: na ? NA
      : worst.run >= RUN ? `Days ${worst.i - worst.run + 1}–${worst.i} sleep higher ${worst.run} nights in a row with no rest day. Guidelines suggest one at least every 3–4 days above 3,000 m.`
      : `The longest run of nights sleeping higher is ${plural(worst.run, 'night')}. Guidelines suggest a rest day at least every 3–4 days above 3,000 m.`,
  });

  if (na) {
    checks.push({ id: 'avg', title: 'Average climb under 500 m a night', source: 'NaTHNaC', state: 'na', detail: NA });
  } else {
    const baseIdx = days.findIndex((d) => d.stop.alt > LINE) - 1;
    const base = baseIdx >= 0 ? days[baseIdx].stop : START;
    const nights = topIdx - baseIdx;
    const avg = Math.round((maxSleep - base.alt) / nights);
    checks.push({
      id: 'avg', title: 'Average climb under 500 m a night', source: 'NaTHNaC',
      state: avg < STEP ? 'ok' : 'warn',
      detail: `From ${base.name} (${fmt(base.alt)} m) to ${top.stop.name} (${fmt(maxSleep)} m) you gain ${fmt(maxSleep - base.alt)} m in ${plural(nights, 'night')}: ${fmt(avg)} m a night on average.` + (avg < STEP ? '' : ' Add rest days to bring it under 500 m.'),
    });
  }
  return { days, checks, issues: checks.filter((c) => c.state === 'warn').length, topIdx, maxSleep, highPoint, rests };
}

// ---------- HTML ----------
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

const PLUS = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 2.5 V13.5 M2.5 8 H13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
const CROSS = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M2.5 2.5 L11.5 11.5 M11.5 2.5 L2.5 11.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';

export function rowsHtml(ev: Evaluation): string {
  const n = ev.days.length;
  return ev.days.map((d) => {
    const stopOpts = STOPS.map((s) => `<option value="${s.id}"${s.id === d.stop.id ? ' selected' : ''}>${esc(s.name)}, ${fmt(s.alt)} m</option>`).join('');
    const hike = d.choices.length
      ? `<label class="pl-hike"><span class="visually-hidden">Day ${d.i}: day hike</span><select class="pl-sel" data-k="h" data-i="${d.i}"><option value="">No day hike</option>${d.choices.map((c) => `<option value="${c.id}"${c.id === d.choice?.id ? ' selected' : ''}>${esc(c.label)}</option>`).join('')}</select></label>`
      : `<div class="pl-hike pl-none">No day hike from here</div>`;
    const tags: string[] = [];
    if (d.high) tags.push(`<span class="pl-tag is-warn">First night above 2,750 m</span>`);
    if (d.over) tags.push(d.covered ? `<span class="pl-tag">Over 500 m, with a rest day next to it</span>` : `<span class="pl-tag is-warn">Over 500 m with no rest day before or after</span>`);
    if (d.run >= RUN) tags.push(`<span class="pl-tag is-warn">${ord(d.run)} night higher in a row</span>`);
    if (d.rest) tags.push(`<span class="pl-tag is-rest">Rest day</span>`);
    if (d.top) tags.push(`<span class="pl-tag">Highest night</span>`);
    const gainCls = d.high || (d.over && !d.covered) ? ' is-warn' : d.gain < 0 ? ' is-down' : '';
    return `<li class="pl-row${d.warn ? ' is-warn' : ''}">`
      + `<div class="pl-day">D${d.i}</div>`
      + `<label class="pl-stop"><span class="visually-hidden">Day ${d.i}: sleep at</span><select class="pl-sel" data-k="s" data-i="${d.i}">${stopOpts}</select></label>`
      + hike
      + `<div class="pl-gain num" title="Change in sleeping altitude from the night before"><span class="visually-hidden">Change from the night before: </span><span class="pl-gain-v${gainCls}">${signed(d.gain)}</span></div>`
      + `<div class="pl-acts">`
      + `<button type="button" class="pl-icon" data-act="stay" data-i="${d.i}" aria-label="Stay another night in ${esc(d.stop.name)}" title="Stay another night in ${esc(d.stop.name)}"${n >= MAX_DAYS ? ' disabled' : ''}>${PLUS}</button>`
      + `<button type="button" class="pl-icon" data-act="del" data-i="${d.i}" aria-label="Remove day ${d.i}" title="Remove day ${d.i}"${n <= MIN_DAYS ? ' disabled' : ''}>${CROSS}</button>`
      + `</div>`
      + (tags.length ? `<div class="pl-tags">${tags.join('')}</div>` : '')
      + `</li>`;
  }).join('');
}

const ICON = {
  ok: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="#1C6E7D"/><path d="M6.5 11.5 L9.5 14.5 L15.5 8" fill="none" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="#F2894E"/><path d="M11 6 V12.5" stroke="#0F2430" stroke-width="2.2" stroke-linecap="round"/><circle cx="11" cy="16" r="1.4" fill="#0F2430"/></svg>',
  na: '<svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true"><circle cx="11" cy="11" r="9.25" fill="none" stroke="#7A8A92" stroke-width="1.5"/><path d="M7 11 H15" stroke="#7A8A92" stroke-width="2" stroke-linecap="round"/></svg>',
};
const STATE_TXT = { ok: 'Passes', warn: 'Needs a look', na: 'Not applicable' };

export function checksHtml(ev: Evaluation): string {
  return ev.checks.map((c) => `<li class="pl-check is-${c.state}">${ICON[c.state]}<div><div class="pl-check-t">${esc(c.title)}<span class="visually-hidden">: ${STATE_TXT[c.state]}</span></div><p class="pl-check-d">${esc(c.detail)}</p><div class="pl-src">${esc(c.source)}</div></div></li>`).join('');
}

export function headlineHtml(ev: Evaluation): string {
  const total = ev.checks.filter((c) => c.state !== 'na').length;
  return ev.issues ? `${ev.issues} of ${total} checks need a look` : ev.maxSleep > LINE ? 'Within the guidelines' : 'Nothing to check yet';
}

export function statsHtml(ev: Evaluation): string {
  const top = ev.days[ev.topIdx];
  const cell = (k: string, v: string, sub: string, color = '') => `<div class="card" style="padding: 16px 20px"><div class="meta">${k}</div><div class="num" style="font-weight: 800; font-size: 28px${color ? `; color: ${color}` : ''}">${v}</div><div class="meta">${esc(sub)}</div></div>`;
  return cell('Days', String(ev.days.length), `Day 0 to day ${ev.days.length - 1}`)
    + cell('Rest days', String(ev.rests), 'On the way up', 'var(--teal)')
    + cell('Highest night', `${fmt(ev.maxSleep)} m`, `${top.stop.name}, day ${top.i}`)
    + cell('Highest point', `${fmt(ev.highPoint.alt)} m`, ev.highPoint.name);
}

// ---------- SVG chart ----------
const y = (a: number) => +(280 - (a - 2400) * 0.073529).toFixed(1);

export function chartHtml(ev: Evaluation): string {
  const n = ev.days.length;
  const step = n > 1 ? 880 / (n - 1) : 0;
  const X = (i: number) => +(70 + i * step).toFixed(1);
  const fs = n > 18 ? 10 : 11;
  const out: string[] = [];
  out.push(`<g stroke="#E3E9EB">${[2400, 3400, 4400, 5400].map((a) => `<line x1="40" x2="970" y1="${y(a)}" y2="${y(a)}"/>`).join('')}</g>`);
  out.push(`<g fill="#7A8A92" font-size="11">${[2400, 3400, 4400, 5400].map((a) => `<text x="36" y="${y(a) + 4}" text-anchor="end">${fmt(a)}</text>`).join('')}</g>`);
  out.push(`<line x1="40" x2="970" y1="${y(LINE)}" y2="${y(LINE)}" stroke="#1C6E7D" stroke-dasharray="5 5"/>`);
  out.push(`<path d="${ev.days.map((d, i) => `${i ? 'L' : 'M'}${X(i)},${y(d.stop.alt)}`).join(' ')}" fill="none" stroke="#0F2430" stroke-width="2.5" stroke-linejoin="round"/>`);
  // Day hike spikes. Labels that would overlap one already drawn move up a line, or are left out (the dot keeps a tooltip).
  const placed: [number, number, number, string][] = []; // x0, x1, baseline y, text
  const free = (x0: number, x1: number, ty: number) => placed.every(([a, b, py]) => x1 < a - 4 || x0 > b + 4 || Math.abs(ty - py) > fs + 2);
  for (const d of ev.days) {
    const hikes = d.choice?.hikes ?? [];
    hikes.forEach((h, k) => {
      const off = hikes.length > 1 ? (k ? 7 : -7) : 0;
      const x = X(d.i) + off;
      const anchor = hikes.length > 1 ? (k ? 'start' : 'end') : x > 880 ? 'end' : 'middle';
      const dx = anchor === 'start' ? 7 : anchor === 'end' ? -7 : 0;
      const label = `${h.name === EBC.name ? 'EBC' : h.name} ${fmt(h.alt)}`;
      const w = label.length * fs * 0.56;
      const x0 = anchor === 'start' ? x + dx : anchor === 'end' ? x + dx - w : x - w / 2;
      const color = h.alt >= 5300 ? '#C2410C' : '#1C6E7D';
      let ty = y(h.alt) - (anchor === 'middle' ? 9 : 4);
      const repeat = placed.some(([a, , , t]) => t === label && Math.abs(a - x0) < w + 60); // same hike on the day before
      if (!free(x0, x0 + w, ty)) ty -= fs + 3;
      const show = !repeat && free(x0, x0 + w, ty) && ty > 12;
      if (show) placed.push([x0, x0 + w, ty, label]);
      out.push(`<g><title>Day ${d.i}: ${esc(h.name)}, ${fmt(h.alt)} m</title><path d="M${x},${y(d.stop.alt)} L${x},${y(h.alt)}" stroke="${color}" stroke-width="1.5" stroke-dasharray="3 3"/><circle cx="${x}" cy="${y(h.alt)}" r="4.5" fill="${color}"/>${show ? `<text x="${x + dx}" y="${ty}" font-size="${fs}" fill="${color}" text-anchor="${anchor}">${esc(label)}</text>` : ''}</g>`);
    });
  }
  for (const d of ev.days) {
    const fill = d.warn ? '#C2410C' : d.rest ? '#1C6E7D' : '#FFFFFF';
    out.push(`<g><title>Day ${d.i}: ${esc(d.stop.name)}, ${fmt(d.stop.alt)} m (${signed(d.gain)})</title><circle cx="${X(d.i)}" cy="${y(d.stop.alt)}" r="6" fill="${fill}" stroke="#0F2430" stroke-width="2"/><text x="${X(d.i)}" y="304" font-size="${fs}" fill="#4A5A63" text-anchor="middle">D${d.i}</text></g>`);
  }
  return out.join('');
}
