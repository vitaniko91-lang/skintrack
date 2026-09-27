/**
 * Весь текст страницы кейса. Цифры — только с источником: без источника не публикуем
 * (спека, «Страница кейса» → Проблема). Цитаты сверены со страницами 2026-09-26.
 */

export interface Source {
  id: string
  publisher: string
  title: string
  url: string
  accessed: string
  quotes: string[]
}

export const SOURCES: Source[] = [
  {
    id: 'slf-levels',
    publisher: 'WSL Institute for Snow and Avalanche Research SLF',
    title: 'Danger levels',
    url: 'https://www.slf.ch/en/avalanche-bulletin-and-snow-situation/about-the-avalanche-bulletin/danger-levels/',
    accessed: '2026-09-26',
    quotes: [
      'Level 2 (moderate): “Around 30 % of avalanche fatalities.” “Forecast for around 50 % of the winter season.”',
      'Level 3 (considerable): “Around 50 % of avalanche fatalities.” “Forecast for around 30 % of the winter season.”',
    ],
  },
  {
    id: 'aa-slope',
    publisher: 'Avalanche.org',
    title: 'Slope Angle — Avalanche Encyclopedia',
    url: 'https://avalanche.org/avalanche-encyclopedia/terrain/slope-characteristics/slope-angle/',
    accessed: '2026-09-26',
    quotes: [
      '“Data from a Swiss dataset of over 1,000 avalanches shows 96% of avalanches released on slope angles between 30 and 50 degrees, and most released on slopes between 34 and 45 degrees.”',
    ],
  },
]

export interface Stat { value: string; label: string; sourceId: string }

export const STATS: Stat[] = [
  { value: '~80%', label: 'of avalanche fatalities in SLF’s data happen at danger level 2 or 3 — about 30% and 50%.', sourceId: 'slf-levels' },
  { value: '~80%', label: 'of the winter, level 2 or 3 is the forecast. The deadly days are the ordinary ones.', sourceId: 'slf-levels' },
  { value: '96%', label: 'of avalanches in a Swiss dataset of 1,000+ released between 30° and 50°; most between 34° and 45°.', sourceId: 'aa-slope' },
]

export const PROBLEM = {
  title: 'The dangerous days look ordinary.',
  body: 'Avalanche accidents don’t cluster on the dramatic days. They happen at moderate and considerable danger — the forecast for most of the season — on slopes steep enough to slide and gentle enough to look skiable. The information to avoid them exists, but it lives in three places: the bulletin in one app, slope angle in another, the route in a third.',
}

export const PERSONA = {
  name: 'Mira',
  age: 32,
  role: 'Weekend ski tourer, Bern',
  background: 'Four seasons of touring with the same group of friends. Took an avalanche course two winters ago. Reads the bulletin — usually in the car.',
  goals: ['Pick a line that matches today’s conditions, not Tuesday’s plan.', 'Know the whole group is ready before anyone leaves the car.'],
  frustrations: ['Bulletin, slope angle and route live in three different apps.', 'Alerts that fire so often she has stopped reading them.'],
  disclaimer: 'Illustrative persona built from the brief — not user research.',
}

export type ScreenRef = 'route' | 'slope' | 'group' | 'warning' | null

export interface JourneyStage { stage: string; doing: string; thinking: string; product: string; screen: ScreenRef }

export const JOURNEY: JourneyStage[] = [
  { stage: 'Evening before', doing: 'Reads the bulletin, sketches a route.', thinking: 'Is danger 3 a no, or a careful yes?', product: 'Build the route, then turn on the slope layer.', screen: 'route' },
  { stage: 'Parking', doing: 'Boots on, transceivers on.', thinking: 'Did everyone switch to send?', product: 'Group check before the car door shuts.', screen: 'group' },
  { stage: 'Ascent', doing: 'Skinning, phone in a chest pocket.', thinking: 'I’ll look at the map at the next stop.', product: 'Nothing. The app stays quiet between sections.', screen: null },
  { stage: 'Ridge decision', doing: 'Couloir ahead: 38°, danger 3.', thinking: 'One at a time, or take the ridge?', product: 'One alert: slope, danger and distance, in words.', screen: 'warning' },
  { stage: 'Descent', doing: 'Skiing the line chosen on the ridge.', thinking: 'Stay in the tracks.', product: 'Route stays on screen; no new alert until the next section.', screen: null },
]

export interface Option {
  id: string
  name: string
  ux: string
  cost: 'Low' | 'Medium' | 'High'
  risk: string
  sourceId?: string
}

export interface Decision {
  id: string
  title: string
  context: string
  options: Option[]
  chosen: string
  why: string
  tradeoffs: string[]
  revisit: string
}

export const DECISIONS: Decision[] = [
  {
    id: 'brand-vs-risk',
    title: 'Brand colour vs the risk scale',
    context: 'The app shows two safety scales on one screen: avalanche danger (green → yellow → orange → red → black-red) and the Swiss slope bands (yellow → orange → red → purple). Any brand accent inside those hues makes a button read like a warning.',
    options: [
      { id: 'ice-cyan', name: 'Ice cyan — saturated #5CE8FF', ux: '✓ outside every hazard hue, and strong enough to work as a colour field: the ribbon, the glow, the pressed state · ✗ a loud accent needs discipline, or it spreads to everything', cost: 'Low', risk: 'Used too widely it stops marking what you can press.' },
      { id: 'lime', name: 'Lime — electric green', ux: '✓ high energy, reads “outdoor tech” · ✗ same family as danger level 1 green: a button reads like “low danger”', cost: 'Low', risk: 'Brand UI borrows the meaning of the safest level on the scale.' },
      { id: 'beacon', name: 'Beacon — signal orange', ux: '✓ high-visibility, classic outdoor · ✗ same hue as danger level 3: a button reads like a warning', cost: 'Low', risk: 'People misread brand UI as hazard, and hazard UI loses its meaning.' },
      { id: 'magenta', name: 'Magenta — hot pink', ux: '✓ ownable, nobody in the category uses it · ✗ no mountain meaning, and it fights the blue duotone of the photos', cost: 'Low', risk: 'The accent reads as fashion, not terrain, and sits next to the purple ≥ 45° band.' },
      { id: 'glacier', name: 'Glacier — pale ice #BFE0EE (tried first)', ux: '✓ outside every hazard hue, calm · ✗ too quiet: about 5% of the screen, and the page read as flat', cost: 'Low', risk: 'A safe accent nobody notices — the energy has to come from somewhere else, and it didn’t.' },
    ],
    chosen: 'ice-cyan',
    why: 'Pale ice was the first choice and it was safe, but at roughly 5% of the screen the page read as flat. The saturated cyan keeps the one property that mattered — it can’t be mistaken for any hazard level — and carries energy as a colour field: the 3D ribbon, the glow on the accent word, the pressed state. Safety colours stay reserved for safety data.',
    tradeoffs: [
      'A loud accent has to be held back on purpose: it marks the route and what you can press, never body text or backgrounds.',
      'Cyan on the dark base is not a contrast cost: 13.8:1 on #04080C, with #B8F7FF only for the glow.',
      'The pale #BFE0EE is gone, and with it the quiet, instrument-like feel of the first direction.',
    ],
    revisit: 'If a regional bulletin adopts blue or cyan for a hazard level, the accent has to move.',
  },
  {
    id: 'one-alert',
    title: 'Warnings without an alarm storm',
    context: 'On the skin track your hands are in gloves, the phone is in a chest pocket and the screen fights snow glare. An app that pings at every threshold teaches people to ignore it.',
    options: [
      { id: 'every-threshold', name: 'Alert at every threshold', ux: '✓ nothing is missed · ✗ dozens of pings per tour — alarm fatigue', cost: 'Low', risk: 'People mute the app, and the alert that matters is ignored.' },
      { id: 'level-3-plus', name: 'Alert only at danger 3+', ux: '✓ rare, so trusted · ✗ silent at level 2, where about 30% of avalanche fatalities happen (SLF)', cost: 'Low', risk: 'A false sense of safety on “moderate” days.', sourceId: 'slf-levels' },
      { id: 'per-section', name: 'One alert per slope section', ux: '✓ one strong signal per decision point: slope, danger and distance together, vibration and type readable in gloves · ✗ depends on cutting the route into good sections', cost: 'Medium', risk: 'Badly cut sections merge two hazards or split one.' },
    ],
    chosen: 'per-section',
    why: 'The alert arrives where the decision is made — before the slope — and says everything at once, in words, not colour alone. Acknowledging it silences only that section.',
    tradeoffs: [
      'Route segmentation becomes a core algorithm, not a detail.',
      'No second alert inside a section. The bulletin doesn’t change hour to hour, so this was accepted.',
    ],
    revisit: 'If field tests show the vibration goes unnoticed in a chest pocket, add an optional sound.',
  },
  {
    id: 'slope-layer',
    title: 'Slope layer: always on, or on request',
    context: 'The slope layer is the product’s core data, but painted over a whole mountain it floods the map: the route and the contours disappear under colour. We hit exactly this in the 3D scene on the product page first.',
    options: [
      { id: 'always', name: 'Always on', ux: '✓ hazard always visible · ✗ unreadable map, route and contours lost under colour', cost: 'Low', risk: 'People stop reading the colour at all.' },
      { id: 'on-request', name: 'On request, off by default', ux: '✓ calm map; turning it on is a deliberate “read the slope” step · ✗ one extra tap, and someone may never tap it', cost: 'Low', risk: 'A route planned without ever seeing the layer — caught by the in-tour alert.' },
      { id: 'auto', name: 'Automatic near hazards', ux: '✓ appears only when relevant · ✗ a layer that shows up by itself is surprising and hard to trust', cost: 'High', risk: 'Unpredictable UI in a safety context.' },
    ],
    chosen: 'on-request',
    why: 'The planning map stays readable, and reading the slope becomes something the user does on purpose. For anyone who never turns it on, the safety net is the second decision: the alert fires on the slope regardless.',
    tradeoffs: [
      'One more tap in the planning flow.',
      'The product page tells the story differently — a quiet tint with a route corridor. That is a presentation choice, not the app’s default.',
    ],
    revisit: 'If testing shows people commit to routes without opening the layer, turn it on automatically when a planned route crosses 30°.',
  },
]
