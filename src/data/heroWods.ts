import { defaultConfig, type TimerConfig, type TimerKind } from '../types/timer'
import type { Wod, WodExercise, WodItem, WodRoundSet } from '../types/wod'

export const HERO_SEED_REVISION = 2

export const HERO_FRAN_ID = 'hero-fran'
export const HERO_CINDY_ID = 'hero-cindy'
export const HERO_GRACE_ID = 'hero-grace'
export const HERO_HELEN_ID = 'hero-helen'
export const HERO_ANNIE_ID = 'hero-annie'
export const HERO_DIANE_ID = 'hero-diane'
export const HERO_KAREN_ID = 'hero-karen'
export const HERO_ISABEL_ID = 'hero-isabel'
export const HERO_JACKIE_ID = 'hero-jackie'
export const HERO_MURPH_ID = 'hero-murph'
export const HERO_DT_ID = 'hero-dt'
export const HERO_CHAD_ID = 'hero-chad'
export const HERO_KALSU_ID = 'hero-kalsu'

function wod(
  id: string,
  name: string,
  kind: TimerKind,
  blocks: WodItem[],
  timer: Partial<TimerConfig> = {},
): Wod {
  const now = Date.now()
  return {
    id,
    name,
    kind,
    blocks,
    timer: { ...defaultConfig(kind), ...timer, kind },
    seeded: true,
    seedRevision: HERO_SEED_REVISION,
    createdAt: now,
    updatedAt: now,
  }
}

function exercise(id: string, text: string, weight = ''): WodExercise {
  return { id, type: 'exercise', text, weight }
}

function rounds(id: string, count: number, items: WodExercise[]): WodRoundSet {
  return { id, type: 'rounds', rounds: count, items }
}

function forTime(minutes: number): Partial<TimerConfig> {
  return { durationSeconds: minutes * 60, countUp: true }
}

function amrap(minutes: number): Partial<TimerConfig> {
  return { durationSeconds: minutes * 60 }
}

function ladder(
  prefix: string,
  reps: number[],
  movements: { slug: string; name: string; weight?: string }[],
): WodExercise[] {
  return reps.flatMap((count) =>
    movements.map((move) =>
      exercise(`${prefix}-${count}-${move.slug}`, `${count} ${move.name}`, move.weight ?? ''),
    ),
  )
}

export function buildFran() {
  return wod(HERO_FRAN_ID, 'Fran', 'forTime', ladder('hero-fran', [21, 15, 9], [
    { slug: 'thrusters', name: 'Thrusters', weight: '43 kg' },
    { slug: 'pullups', name: 'Pull-ups' },
  ]), forTime(10))
}

export function buildCindy() {
  return wod(HERO_CINDY_ID, 'Cindy', 'amrap', [
    exercise('hero-cindy-pullups', '5 Pull-ups'),
    exercise('hero-cindy-pushups', '10 Push-ups'),
    exercise('hero-cindy-squats', '15 Air Squats'),
  ], amrap(20))
}

export function buildGrace() {
  return wod(HERO_GRACE_ID, 'Grace', 'forTime', [
    exercise('hero-grace-cj', '30 Clean and Jerks', '61 kg'),
  ], forTime(10))
}

export function buildHelen() {
  return wod(HERO_HELEN_ID, 'Helen', 'forTime', [
    rounds('hero-helen-rounds', 3, [
      exercise('hero-helen-run', '400 m Run'),
      exercise('hero-helen-kb', '21 Kettlebell Swings', '24 kg'),
      exercise('hero-helen-pullups', '12 Pull-ups'),
    ]),
  ], forTime(20))
}

export function buildAnnie() {
  return wod(HERO_ANNIE_ID, 'Annie', 'forTime', ladder('hero-annie', [50, 40, 30, 20, 10], [
    { slug: 'du', name: 'Double-unders' },
    { slug: 'situps', name: 'Sit-ups' },
  ]), forTime(15))
}

export function buildDiane() {
  return wod(HERO_DIANE_ID, 'Diane', 'forTime', ladder('hero-diane', [21, 15, 9], [
    { slug: 'dl', name: 'Deadlifts', weight: '102 kg' },
    { slug: 'hspu', name: 'Handstand Push-ups' },
  ]), forTime(10))
}

export function buildKaren() {
  return wod(HERO_KAREN_ID, 'Karen', 'forTime', [
    exercise('hero-karen-wb', '150 Wall-ball Shots (3 m)', '9 kg'),
  ], forTime(20))
}

export function buildIsabel() {
  return wod(HERO_ISABEL_ID, 'Isabel', 'forTime', [
    exercise('hero-isabel-snatch', '30 Snatches', '61 kg'),
  ], forTime(10))
}

export function buildJackie() {
  return wod(HERO_JACKIE_ID, 'Jackie', 'forTime', [
    exercise('hero-jackie-row', '1000 m Row'),
    exercise('hero-jackie-thrusters', '50 Thrusters', '20 kg'),
    exercise('hero-jackie-pullups', '30 Pull-ups'),
  ], forTime(20))
}

export function buildMurph() {
  return wod(HERO_MURPH_ID, 'Murph', 'forTime', [
    exercise('hero-murph-run-1', '1 Mile Run'),
    exercise('hero-murph-pullups', '100 Pull-ups'),
    exercise('hero-murph-pushups', '200 Push-ups'),
    exercise('hero-murph-squats', '300 Air Squats'),
    exercise('hero-murph-run-2', '1 Mile Run'),
  ], forTime(60))
}

export function buildDt() {
  return wod(HERO_DT_ID, 'DT', 'forTime', [
    rounds('hero-dt-rounds', 5, [
      exercise('hero-dt-dl', '12 Deadlifts', '70 kg'),
      exercise('hero-dt-hpc', '9 Hang Power Cleans', '70 kg'),
      exercise('hero-dt-pj', '6 Push Jerks', '70 kg'),
    ]),
  ], forTime(20))
}

export function buildChad() {
  return wod(HERO_CHAD_ID, 'Chad', 'forTime', [
    exercise('hero-chad-steps', '1000 Box Step-ups (20 in)', '20 kg'),
  ], forTime(90))
}

export function buildKalsu() {
  return wod(HERO_KALSU_ID, 'Kalsu', 'forTime', [
    exercise('hero-kalsu-burpees', 'EMOM: 5 Burpees'),
    exercise('hero-kalsu-thrusters', 'Thrusters hasta 100 reps', '61 kg'),
  ], forTime(30))
}

export const HERO_WODS: { id: string; build: () => Wod }[] = [
  { id: HERO_FRAN_ID, build: buildFran },
  { id: HERO_CINDY_ID, build: buildCindy },
  { id: HERO_GRACE_ID, build: buildGrace },
  { id: HERO_HELEN_ID, build: buildHelen },
  { id: HERO_ANNIE_ID, build: buildAnnie },
  { id: HERO_DIANE_ID, build: buildDiane },
  { id: HERO_KAREN_ID, build: buildKaren },
  { id: HERO_ISABEL_ID, build: buildIsabel },
  { id: HERO_JACKIE_ID, build: buildJackie },
  { id: HERO_MURPH_ID, build: buildMurph },
  { id: HERO_DT_ID, build: buildDt },
  { id: HERO_CHAD_ID, build: buildChad },
  { id: HERO_KALSU_ID, build: buildKalsu },
]

export function isHeroWodId(id: string) {
  return HERO_WODS.some((hero) => hero.id === id)
}

export function buildHeroWod(id: string) {
  return HERO_WODS.find((hero) => hero.id === id)?.build() ?? null
}
