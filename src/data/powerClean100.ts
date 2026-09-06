import type { Program, ProgramDay, ProgramExercise, ProgramSet, ProgramWeek } from '../types/program'

const ID = 'power-clean-100'

type DraftSet = { reps: number; kg: number | string }
type DraftEx = { name: string; cue?: string; sets: DraftSet[] }
type DraftDay = { name: string; focus: string; exercises: DraftEx[] }
type DraftWeek = {
  number: number
  title: string
  phase: string
  goal: string
  days: DraftDay[]
}

function n(count: number, reps: number, kg: number | string): DraftSet[] {
  return Array.from({ length: count }, () => ({ reps, kg }))
}

function wave(...pairs: [number, number | string][]): DraftSet[] {
  return pairs.map(([reps, kg]) => ({ reps, kg }))
}

function stampSet(prefix: string, index: number, draft: DraftSet): ProgramSet {
  const weightText = String(draft.kg)
  return {
    id: `${prefix}-s${index}`,
    reps: draft.reps,
    weightKg: typeof draft.kg === 'number' ? draft.kg : null,
    weightText,
  }
}

function stampEx(prefix: string, index: number, draft: DraftEx): ProgramExercise {
  const id = `${prefix}-e${index}`
  return {
    id,
    name: draft.name,
    cue: draft.cue ?? '',
    sets: draft.sets.map((set, setIndex) => stampSet(id, setIndex, set)),
  }
}

function stampDay(prefix: string, index: number, draft: DraftDay): ProgramDay {
  const id = `${prefix}-d${index}`
  return {
    id,
    name: draft.name,
    focus: draft.focus,
    exercises: draft.exercises.map((exercise, exerciseIndex) => stampEx(id, exerciseIndex, exercise)),
  }
}

function stampWeek(draft: DraftWeek): ProgramWeek {
  const id = `${ID}-w${String(draft.number).padStart(2, '0')}`
  return {
    id,
    number: draft.number,
    title: draft.title,
    phase: draft.phase,
    goal: draft.goal,
    days: draft.days.map((day, index) => stampDay(id, index + 1, day)),
  }
}

const WEEKS: DraftWeek[] = [
  {
    number: 1,
    title: 'Aceleración',
    phase: 'Fase 1 · Re-aceleración',
    goal: '88-90 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Velocidad de tirón & Front Squat',
        exercises: [
          { name: 'Hang Power Clean', cue: '70%', sets: n(5, 3, 55) },
          { name: 'Front Squat', sets: n(4, 4, 80) },
          { name: 'Clean Pulls', cue: 'Énfasis en la extensión', sets: n(4, 3, 80) },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Potencia desde suelo & Back Squat',
        exercises: [
          { name: 'Power Clean', cue: 'Pausa 1s en rodilla', sets: n(5, 2, 60) },
          { name: 'Back Squat', sets: n(4, 5, 100) },
          { name: 'Push Press', sets: n(4, 4, '60-65') },
        ],
      },
    ],
  },
  {
    number: 2,
    title: 'Contacto',
    phase: 'Fase 1 · Re-aceleración',
    goal: '88-90 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Velocidad de tirón & Front Squat',
        exercises: [
          { name: 'High Hang Power Clean', sets: n(4, 2, 60) },
          { name: 'Front Squat', cue: 'Pausa 2s abajo', sets: n(4, 3, 85) },
          { name: 'Clean High Pulls', sets: n(4, 3, 85) },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Potencia desde suelo & Back Squat',
        exercises: [
          { name: 'Power Clean', sets: [...n(4, 2, 64), ...n(2, 1, 68)] },
          { name: 'Back Squat', sets: n(4, 4, 105) },
          { name: 'Push Press', sets: n(4, 3, '65-70') },
        ],
      },
    ],
  },
  {
    number: 3,
    title: 'Confianza',
    phase: 'Fase 1 · Re-aceleración',
    goal: '88-90 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Velocidad de tirón & Front Squat',
        exercises: [
          { name: 'Hang Power Clean', sets: [...n(3, 2, 64), ...n(2, 1, 68)] },
          { name: 'Front Squat', sets: n(4, 2, 90) },
          { name: 'Clean Pulls', sets: n(3, 2, 88) },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Potencia desde suelo & Back Squat',
        exercises: [
          {
            name: 'Power Clean (Onda 1)',
            cue: '1@64 · 1@68 · 1@72',
            sets: wave([1, 64], [1, 68], [1, 72]),
          },
          {
            name: 'Power Clean (Onda 2)',
            cue: '1@68 · 1@72 · 1@74',
            sets: wave([1, 68], [1, 72], [1, 74]),
          },
          { name: 'Back Squat', sets: n(4, 3, '110-112') },
        ],
      },
    ],
  },
  {
    number: 4,
    title: 'Test Fase 1',
    phase: 'Fase 1 · Re-aceleración',
    goal: '88-90 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Descarga activa + test Power Clean',
        exercises: [
          { name: 'Hang Power Clean', cue: 'Descarga activa', sets: n(3, 2, 52) },
          { name: 'Front Squat', sets: n(3, 2, 70) },
          {
            name: 'Test Power Clean · aproximaciones',
            sets: wave([3, 40], [2, 50], [2, 60], [1, 70]),
          },
          {
            name: 'Test Power Clean · intentos',
            cue: '90 kg opcional',
            sets: wave([1, 76], [1, 82], [1, '86-88'], [1, 90]),
          },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Front Squat single',
        exercises: [{ name: 'Front Squat', cue: 'Buscar single sólida', sets: n(1, 1, 105) }],
      },
    ],
  },
  {
    number: 5,
    title: 'Sobrecarga',
    phase: 'Fase 2 · Sobrecarga estructural',
    goal: '92-95 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Tirón pesado & Front Squat',
        exercises: [
          { name: 'Hang Power Clean', cue: 'Desde rodilla', sets: n(4, 2, 72) },
          { name: 'Front Squat', sets: n(4, 3, '88-90') },
          { name: 'Clean Pulls', sets: n(4, 3, 95) },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Potencia & Back Squat pesada',
        exercises: [
          { name: 'Power Clean', cue: 'Desde suelo', sets: n(5, 2, 75) },
          { name: 'Back Squat', sets: n(4, 4, 112) },
          { name: 'Push Press', sets: n(4, 3, '70-75') },
        ],
      },
    ],
  },
  {
    number: 6,
    title: 'Intensidad',
    phase: 'Fase 2 · Sobrecarga estructural',
    goal: '92-95 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Tirón pesado & Front Squat',
        exercises: [
          { name: 'High Hang Power Clean', sets: n(4, 2, 75) },
          { name: 'Front Squat', sets: [...n(3, 3, 92), ...n(1, 2, 96)] },
          { name: 'Clean High Pulls', cue: 'Sobre ombligo', sets: n(4, 2, 100) },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Potencia & Back Squat pesada',
        exercises: [
          { name: 'Power Clean', sets: [...n(3, 2, 78), ...n(2, 1, 82)] },
          { name: 'Back Squat', sets: n(4, 3, 118) },
          { name: 'Push Jerk / Power Jerk', cue: 'Series pesadas', sets: n(4, 2, 'pesadas') },
        ],
      },
    ],
  },
  {
    number: 7,
    title: 'Pico de carga',
    phase: 'Fase 2 · Sobrecarga estructural',
    goal: '92-95 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Tirón pesado & Front Squat',
        exercises: [
          { name: 'Hang Power Clean', sets: [...n(3, 1, 80), ...n(2, 1, 85)] },
          { name: 'Front Squat', sets: wave([1, 95], [1, 100], [1, '105-108']) },
          { name: 'Clean Pulls', sets: n(3, 2, '105-110') },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Potencia & Back Squat pesada',
        exercises: [
          {
            name: 'Power Clean (Onda 1)',
            cue: '1@80 · 1@85 · 1@88',
            sets: wave([1, 80], [1, 85], [1, 88]),
          },
          {
            name: 'Power Clean (Onda 2)',
            cue: '1@84 · 1@88 · 1@92',
            sets: wave([1, 84], [1, 88], [1, 92]),
          },
          { name: 'Back Squat', sets: n(3, 2, 125) },
        ],
      },
    ],
  },
  {
    number: 8,
    title: 'Test Fase 2',
    phase: 'Fase 2 · Sobrecarga estructural',
    goal: '92-95 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Test Front Squat',
        exercises: [
          { name: 'Power Clean', cue: 'Pura velocidad', sets: n(3, 2, 65) },
          { name: 'Front Squat', sets: n(2, 2, 80) },
          { name: 'Test Front Squat 1RM', cue: 'Objetivo 112-115 kg', sets: n(1, 1, '112-115') },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Test Power Clean',
        exercises: [
          {
            name: 'Test Power Clean · intentos',
            cue: '94-95 kg',
            sets: wave([1, 85], [1, 90], [1, '94-95']),
          },
        ],
      },
    ],
  },
  {
    number: 9,
    title: 'Consolidar',
    phase: 'Fase 3 · Pico de potencia',
    goal: '100 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Aceleración máxima & soporte',
        exercises: [
          { name: 'Hang Power Clean', sets: n(4, 2, 78) },
          { name: 'Front Squat', sets: n(3, 3, '98-100') },
          { name: 'Clean High Pulls', sets: n(4, 2, 105) },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Aproximación al récord & fuerza',
        exercises: [
          { name: 'Power Clean', sets: [...n(4, 1, 85), ...n(2, 1, 88)] },
          { name: 'Back Squat', sets: n(3, 3, 125) },
        ],
      },
    ],
  },
  {
    number: 10,
    title: 'Sobrecarga 100+',
    phase: 'Fase 3 · Pico de potencia',
    goal: '100 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Aceleración máxima & soporte',
        exercises: [
          { name: 'High Hang Power Clean', sets: [...n(3, 1, 82), ...n(2, 1, 86)] },
          { name: 'Front Squat', sets: wave([1, 100], [1, 108], [1, 114]) },
          { name: 'Clean Pulls', cue: 'Pesados', sets: n(3, 2, '115-120') },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Aproximación al récord & fuerza',
        exercises: [
          { name: 'Power Clean', sets: wave([1, 85], [1, 90], [1, 94], [1, 96]) },
          { name: 'Back Squat', sets: n(2, 2, 132) },
        ],
      },
    ],
  },
  {
    number: 11,
    title: 'Afinamiento',
    phase: 'Fase 3 · Pico de potencia',
    goal: '100 kg',
    days: [
      {
        name: 'Día 1',
        focus: 'Aceleración máxima & soporte',
        exercises: [
          { name: 'Hang Power Clean', cue: 'Máxima aceleración', sets: n(3, 1, 80) },
          { name: 'Front Squat', sets: n(2, 2, 95) },
          { name: 'Clean Pulls', cue: 'Velocidad de codos', sets: n(2, 2, 100) },
        ],
      },
      {
        name: 'Día 2',
        focus: 'Aproximación al récord & fuerza',
        exercises: [
          { name: 'Power Clean', cue: 'Singles técnicamente perfectas', sets: n(3, 1, 88) },
          { name: 'Back Squat', cue: 'Movilidad activa', sets: n(2, 2, 115) },
        ],
      },
    ],
  },
  {
    number: 12,
    title: 'Día 100 kg',
    phase: 'Fase 3 · Pico de potencia',
    goal: '100 kg',
    days: [
      {
        name: 'Día A · Tapering',
        focus: 'Miércoles · descarga',
        exercises: [
          { name: 'Power Clean', cue: 'Codos rápidos', sets: n(3, 1, 60) },
          { name: 'Front Squat', sets: n(2, 1, 80) },
          { name: 'Movilidad', cue: 'Muñecas y tobillos', sets: n(1, 1, 'libre') },
        ],
      },
      {
        name: 'Día de test oficial',
        focus: 'Sábado · 100 kg',
        exercises: [
          {
            name: 'Aproximaciones',
            sets: wave([3, 40], [2, 60], [1, 75], [1, 85]),
          },
          { name: 'Intento 1', cue: 'Seguro', sets: n(1, 1, 92) },
          { name: 'Intento 2', cue: 'Confianza', sets: n(1, 1, 96) },
          { name: 'Intento 3', cue: '100 kg', sets: n(1, 1, 100) },
        ],
      },
    ],
  },
]

export const POWER_CLEAN_PROGRAM_ID = ID

export function buildPowerCleanProgram(): Program {
  const now = Date.now()
  return {
    id: ID,
    name: 'Road to 100 kg',
    subtitle: 'Power Clean · 12 semanas',
    notes:
      'PDF orientativo: edita kilos, series y reps en la app. Descansos 2–3 min entre series principales. Si la barra desacelera o la recepción es fea, no subas de peso ese día.\n\nClaves: paciencia en el 1er tirón, contacto en muslo alto, latigazo de codos, pies de salto a sentadilla (sin starfish).',
    seeded: true,
    targets: [
      { movement: 'Power Clean', start: '80 kg', goal: '100 kg', ratio: 'Meta' },
      { movement: 'Front Squat', start: '100 kg', goal: '115-120 kg', ratio: '~83% PC' },
      { movement: 'Back Squat', start: '120-130 kg', goal: '135-145 kg', ratio: '~70% PC' },
      { movement: 'Clean Pulls', start: '80 kg', goal: '115-120 kg', ratio: 'Sobrecarga' },
    ],
    weeks: WEEKS.map(stampWeek),
    createdAt: now,
    updatedAt: now,
  }
}
