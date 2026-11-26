// Classic EBC itinerary. Altitudes rounded; published figures differ by 20–100 m — verify before launch.
// Kala Patthar: the old site uses 5,545 m; many sources give ~5,644 m.
export const LAST_CHECKED = '[DATE]';

export interface Day { short: string; title: string; sleep: number; rest?: boolean; note: string }

export const DAYS: Day[] = [
  { short: 'D0', title: 'Fly Kathmandu to Lukla', sleep: 2860, note: 'Land at Tenzing-Hillary Airport. Most itineraries walk on the same day.' },
  { short: 'D1', title: 'Lukla to Phakding', sleep: 2610, note: 'An easy first day, mostly downhill along the Dudh Kosi.' },
  { short: 'D2', title: 'Phakding to Namche Bazaar', sleep: 3440, note: 'The long climb to Namche. Sleep gain is above the 500 m guideline, so the rest day that follows matters.' },
  { short: 'D3', title: 'Namche: rest day', sleep: 3440, rest: true, note: 'Acclimatization day: walk higher in the morning, come back down to sleep.' },
  { short: 'D4', title: 'Namche to Tengboche', sleep: 3860, note: 'Past the monastery at Tengboche, home of the Mani Rimdu festival.' },
  { short: 'D5', title: 'Tengboche to Dingboche', sleep: 4410, note: 'Slightly over +500 m. Drink well, walk slowly.' },
  { short: 'D6', title: 'Dingboche: rest day', sleep: 4410, rest: true, note: 'Second acclimatization day: hike higher, sleep low.' },
  { short: 'D7', title: 'Dingboche to Lobuche', sleep: 4940, note: 'Over +500 m again, across the memorial ridge above Thukla.' },
  { short: 'D8', title: 'Lobuche to Gorak Shep and EBC', sleep: 5164, note: 'Highest night of the trek. Afternoon visit to Base Camp at 5,364 m.' },
  { short: 'D9', title: 'Kala Patthar to Pheriche', sleep: 4371, note: 'Dawn climb of Kala Patthar for the Everest view, then a long descent.' },
  { short: 'D10', title: 'Pheriche to Namche', sleep: 3440, note: 'Downhill most of the day; the air feels thick again.' },
  { short: 'D11', title: 'Namche to Lukla', sleep: 2860, note: 'Last day on the trail. Fly out the next morning, weather permitting.' },
];

export const PEAKS = { ebc: { day: 8, alt: 5364 }, kalaPatthar: { day: 9, alt: 5545 } };
export const fmt = (n: number) => n.toLocaleString('en-US');
