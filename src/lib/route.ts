// Classic EBC itinerary; altitudes as most 2026 itineraries list them (published figures differ by 20–100 m).
// Kala Patthar: GPS-measured summit 5,644.5 m (2006, 2008); often listed as 5,545 m, a lower point on the same ridge.
export const LAST_CHECKED = '26 November 2026';

export interface Hike { name: string; alt: number }
export interface Day { short: string; title: string; sleep: number; rest?: boolean; note: string; hikes?: Hike[]; time?: string }

export const DAYS: Day[] = [
  { short: 'D0', title: 'Fly Kathmandu to Lukla', sleep: 2860, note: 'Land at Tenzing-Hillary Airport. Most itineraries walk on the same day.' },
  { short: 'D1', title: 'Lukla to Phakding', sleep: 2610, note: 'An easy first day, mostly downhill along the Dudh Kosi.' },
  { short: 'D2', title: 'Phakding to Namche Bazaar', sleep: 3440, note: 'The long climb to Namche. Sleep gain is above the 500 m guideline, so the rest day that follows matters.' },
  { short: 'D3', title: 'Namche: rest day', sleep: 3440, rest: true, hikes: [{ name: 'Hotel Everest View', alt: 3880 }], note: 'Acclimatization day: walk up to Hotel Everest View in the morning, come back down to Namche to sleep.' },
  { short: 'D4', title: 'Namche to Tengboche', sleep: 3860, note: 'Past the monastery at Tengboche, home of the Mani Rimdu festival.' },
  { short: 'D5', title: 'Tengboche to Dingboche', sleep: 4410, note: 'Slightly over +500 m. Drink well, walk slowly.' },
  { short: 'D6', title: 'Dingboche: rest day', sleep: 4410, rest: true, hikes: [{ name: 'Nangkartshang', alt: 5083 }], note: 'Second acclimatization day: hike towards Nangkartshang Peak, then sleep low again in Dingboche.' },
  { short: 'D7', title: 'Dingboche to Lobuche', sleep: 4940, note: 'Over +500 m again, across the memorial ridge above Thukla.' },
  { short: 'D8', title: 'Lobuche to Gorak Shep and EBC', sleep: 5164, note: 'Highest night of the trek. Afternoon visit to Base Camp at 5,364 m.' },
  { short: 'D9', title: 'Kala Patthar to Pheriche', sleep: 4371, note: 'Dawn climb of Kala Patthar for the Everest view, then a long descent.' },
  { short: 'D10', title: 'Pheriche to Namche', sleep: 3440, note: 'Downhill most of the day; the air feels thick again.' },
  { short: 'D11', title: 'Namche to Lukla', sleep: 2860, note: 'Last day on the trail. Fly out the next morning, weather permitting.' },
];

export const PEAKS = { ebc: { day: 8, alt: 5364 }, kalaPatthar: { day: 9, alt: 5644 } };
export const fmt = (n: number) => n.toLocaleString('en-US');

// Day 8–9 at the top of the trek: three ways to fit in Everest Base Camp and Kala Patthar.
// Walking times: Lobuche–Gorak Shep 2–4 h; Gorak Shep–EBC and back 4–5 h; Gorak Shep–Kala Patthar and back 3–4 h;
// Kala Patthar then down to Pheriche 7–8 h (published itineraries, Nov 2026). Day totals are sums of those ranges.
const EBC: Hike = { name: 'Everest Base Camp', alt: 5364 };
const KP: Hike = { name: 'Kala Patthar', alt: 5644 };
export type PlanId = 'ebc' | 'kp' | 'both';
export const PLANS: Record<PlanId, { label: string; summary: string; d8: Partial<Day>; d9: Partial<Day> }> = {
  ebc: {
    label: 'EBC first',
    summary: 'The usual plan. Reach Gorak Shep in the morning, walk to Base Camp in the afternoon, and climb Kala Patthar at sunrise the next day before heading down.',
    d8: { title: 'Lobuche to Gorak Shep, then EBC', hikes: [EBC], time: '6–9 h', note: 'Leave your bag in a Gorak Shep lodge, walk to Base Camp and back in the afternoon. Highest night of the trek.' },
    d9: { title: 'Kala Patthar at dawn, then down to Pheriche', hikes: [KP], time: '7–8 h', note: 'Start in the dark for the sunrise view of Everest from Kala Patthar, then a long descent to Pheriche.' },
  },
  kp: {
    label: 'Kala Patthar first',
    summary: 'Climb Kala Patthar for sunset on the day you arrive, and walk to Base Camp the next morning. Day 9 becomes the long one.',
    d8: { title: 'Lobuche to Gorak Shep, Kala Patthar at sunset', hikes: [KP], time: '5–8 h', note: 'Arrive at Gorak Shep by midday, rest, then climb Kala Patthar for the evening light on Everest and Nuptse.' },
    d9: { title: 'EBC in the morning, then down to Pheriche', hikes: [EBC], time: 'about 8–10 h', note: 'Base Camp and back before the descent makes this a long day. Some trekkers stop at Lobuche instead and add a day to the walk out.' },
  },
  both: {
    label: 'Both on day 8',
    summary: 'Base Camp and Kala Patthar on the day you reach Gorak Shep. Possible for fit, well-acclimatized trekkers, but it means 9–13 hours of walking above 5,000 m. Not recommended.',
    d8: { title: 'Lobuche to Gorak Shep, EBC and Kala Patthar', hikes: [EBC, KP], time: '9–13 h', note: 'Three walks in one day at the highest altitude of the trek. Only if you feel completely well, and turn back at the first sign of altitude sickness.' },
    d9: { title: 'Gorak Shep down to Pheriche', hikes: [], time: 'about 4–5 h', note: 'An easier day: the whole descent, with no climb before it.' },
  },
};
