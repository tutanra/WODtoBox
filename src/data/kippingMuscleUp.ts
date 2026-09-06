import type { Program, ProgramDay, ProgramExercise, ProgramSet, ProgramWeek } from '../types/program'

const ID = 'kipping-muscle-up'

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

function n(count: number, reps: number, kg: number | string = ''): DraftSet[] {
  return Array.from({ length: count }, () => ({ reps, kg }))
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
    title: 'Base de tracción',
    phase: 'Fase 1 · Fuerza y cadera',
    goal: 'Altura de tirón',
    days: [
      {
        name: 'Sesión A',
        focus: 'Fuerza estricta + transición guiada',
        exercises: [
          { name: 'Dominadas estrictas (pronas)', cue: '3-4 reps · RPE 8', sets: n(4, 4) },
          { name: 'Dominadas negativas', cue: '5 s de bajada', sets: n(3, 3) },
          { name: 'Transición asistida en barra baja', cue: 'Cajón / pies apoyados', sets: n(4, 5) },
        ],
      },
      {
        name: 'Sesión B',
        focus: 'Dinámica de kip + potencia de cadera',
        exercises: [
          { name: 'Hollow to Arch kipping swings', cue: 'Tensión total', sets: n(4, 6) },
          { name: 'Straight-arm lat pushdowns', cue: 'Banda o barra', sets: n(4, 6) },
          { name: 'Straight bar dips', cue: 'Cajón o paralelas', sets: n(4, 5) },
        ],
      },
    ],
  },
  {
    number: 2,
    title: 'Contacto al pecho',
    phase: 'Fase 1 · Fuerza y cadera',
    goal: 'Altura de tirón',
    days: [
      {
        name: 'Sesión A',
        focus: 'Fuerza estricta + transición guiada',
        exercises: [
          { name: 'Chest to bar con banda ligera', cue: 'Pausa 1s al pecho', sets: n(4, 3, 'banda ligera') },
          { name: 'Dominadas neutras estrictas', sets: n(3, 4) },
          { name: 'Transición en salto a recepción de dip', cue: 'Desde cajón', sets: n(4, 4) },
        ],
      },
      {
        name: 'Sesión B',
        focus: 'Dinámica de kip + potencia de cadera',
        exercises: [
          { name: 'Kip swing + big hip drive', cue: 'Cadera a barra, brazos rectos', sets: n(5, 3) },
          { name: 'Straight bar dips profundos', cue: 'Pecho tocando la barra', sets: n(4, 6) },
          { name: 'Toes to bar o knees to elbows', cue: '6-8 reps', sets: n(3, 8) },
        ],
      },
    ],
  },
  {
    number: 3,
    title: 'Volumen y banda',
    phase: 'Fase 1 · Fuerza y cadera',
    goal: 'Altura de tirón',
    days: [
      {
        name: 'Sesión A',
        focus: 'Fuerza estricta + transición guiada',
        exercises: [
          { name: 'Dominadas estrictas', cue: 'Acumular volumen', sets: n(5, 3) },
          { name: 'High pulls con salto', cue: 'Tirón explosivo al esternón', sets: n(4, 3) },
          { name: 'Kipping muscle-up con banda media', cue: '2 reps fluidas', sets: n(4, 2, 'banda media') },
        ],
      },
      {
        name: 'Sesión B',
        focus: 'Dinámica de kip + potencia de cadera',
        exercises: [
          { name: 'Hips to bar explosivos', cue: 'Kipping alto', sets: n(4, 3) },
          { name: 'Russian dips / transiciones en paralelas', sets: n(3, 5) },
          { name: 'Hollow body hold', cue: '25 s', sets: n(4, 25) },
        ],
      },
    ],
  },
  {
    number: 4,
    title: 'Test de control',
    phase: 'Fase 1 · Fuerza y cadera',
    goal: '7-8 dominadas · 2 C2B',
    days: [
      {
        name: 'Sesión A',
        focus: 'Tests de tracción',
        exercises: [
          { name: 'Test dominadas estrictas unbroken', cue: 'Al fallo técnico · buscar 7-8', sets: n(1, 8) },
          { name: 'Test chest to bar estrictas', cue: '2 reps consecutivas limpias', sets: n(1, 2) },
        ],
      },
      {
        name: 'Sesión B',
        focus: 'Banda fina + intentos sin banda',
        exercises: [
          { name: 'Kipping muscle-up asistido', cue: 'Banda fina', sets: n(4, 2, 'banda fina') },
          { name: 'Kipping muscle-up sin banda', cue: '3-4 intentos bien descansados', sets: n(4, 1) },
        ],
      },
    ],
  },
  {
    number: 5,
    title: 'Transferencia',
    phase: 'Fase 2 · Movimiento completo',
    goal: 'Singles sólidas',
    days: [
      {
        name: 'Sesión A',
        focus: 'Potencia vertical + tránsito rápido',
        exercises: [
          { name: 'High pull-ups con kipping', cue: 'Tirón al ombligo', sets: n(4, 3) },
          { name: 'Band muscle-up', cue: 'Goma muy fina · agresividad', sets: n(4, 2, 'banda muy fina') },
          { name: 'Excéntricas de muscle-up', cue: 'Bajada 5 s', sets: n(3, 2) },
        ],
      },
      {
        name: 'Sesión B',
        focus: 'Kipping eficiente + bloqueo',
        exercises: [
          { name: 'Glide kip + sit-up sobre la barra', cue: 'Cadera explosiva', sets: n(4, 3) },
          { name: 'Straight bar dips', cue: 'Pausa 2 s abajo', sets: n(4, 6) },
          { name: 'L-sit hold', cue: '15-20 s · anillas o barra', sets: n(3, 20) },
        ],
      },
    ],
  },
  {
    number: 6,
    title: 'Singles',
    phase: 'Fase 2 · Movimiento completo',
    goal: 'Singles sólidas',
    days: [
      {
        name: 'Sesión A',
        focus: 'Potencia vertical + tránsito rápido',
        exercises: [
          { name: 'Chest to bar kipping', cue: '3 reps fluidas', sets: n(4, 3) },
          { name: 'Kipping muscle-up singles', cue: 'Sin banda · 3 min de descanso', sets: n(5, 1) },
          { name: 'Dominadas estrictas', cue: 'Pausa 2 s arriba', sets: n(3, 3) },
        ],
      },
      {
        name: 'Sesión B',
        focus: 'Kipping eficiente + bloqueo',
        exercises: [
          { name: 'Kipping muscle-up a dip profundo', cue: 'Recibir abajo', sets: n(4, 2) },
          { name: 'Straight bar dips con sobrecarga', cue: '+5 kg o chaleco', sets: n(3, 5, '+5') },
          { name: 'V-ups dinámicos', sets: n(3, 15) },
        ],
      },
    ],
  },
  {
    number: 7,
    title: 'Enlazar reps',
    phase: 'Fase 2 · Movimiento completo',
    goal: 'Linking 2 reps',
    days: [
      {
        name: 'Sesión A',
        focus: 'Potencia vertical + tránsito rápido',
        exercises: [
          { name: 'Kipping muscle-up EMOM', cue: '6 min · 1 rep limpia cada minuto', sets: n(6, 1) },
          { name: 'High pull-ups explosivas', sets: n(3, 2) },
          { name: 'Dominadas estrictas lastradas', cue: '+2.5 a 5 kg', sets: n(3, 3, '+2.5-5') },
        ],
      },
      {
        name: 'Sesión B',
        focus: 'Kipping eficiente + bloqueo',
        exercises: [
          { name: 'Conexión de 2 kipping muscle-ups', cue: 'Linking · 3 intentos', sets: n(3, 2) },
          { name: 'Fondos en paralelas o barra recta', cue: '8 reps fluidas', sets: n(3, 8) },
          { name: 'Arch to hollow rocks', cue: 'Bloqueo perfecto', sets: n(3, 12) },
        ],
      },
    ],
  },
  {
    number: 8,
    title: 'Test final',
    phase: 'Fase 2 · Movimiento completo',
    goal: 'Single + linking 2-3',
    days: [
      {
        name: 'Sesión A',
        focus: 'Activación técnica',
        exercises: [
          { name: 'Kipping muscle-up con banda fina', cue: 'Activación · 2 reps', sets: n(1, 2, 'banda fina') },
          { name: 'Movilidad de hombros y codos', cue: 'Antes del test', sets: n(1, 1, 'libre') },
        ],
      },
      {
        name: 'Sesión B',
        focus: 'Test oficial',
        exercises: [
          { name: 'Intento 1 · single', cue: 'Impecable y controlada', sets: n(1, 1) },
          { name: 'Intento 2 · linking', cue: '2-3 reps unbroken', sets: n(1, 3) },
          { name: 'Intento 3 · C2B estrictas', cue: 'Objetivo ≥ 3 reps', sets: n(1, 3) },
        ],
      },
    ],
  },
]

export const KIPPING_MUSCLE_UP_ID = ID

export function buildKippingMuscleUpProgram(): Program {
  const now = Date.now()
  return {
    id: ID,
    name: 'Kipping Muscle-Up',
    subtitle: 'Especialización · 8 semanas',
    notes:
      'PDF orientativo: 2 sesiones cortas (15-20 min) por semana. Día A fuerza estricta, día B kip y transición. No flexiones los codos hasta que la cadera esté arriba.\n\nDescansos ~2 min entre series de MU o dominadas. Cero fallo absoluto en estrictas (deja 1 rep de reserva). Si molestan los codos, cambia excéntricas por transiciones con goma.\n\nClaves: cargar el arch, brazos rígidos al inicio, fast sit-up, agarre con nudillos arriba.',
    seeded: true,
    targets: [
      { movement: 'Dominadas', start: '5-6', goal: '10-12', ratio: 'Reserva' },
      { movement: 'C2B estrictas', start: '1', goal: '4-5', ratio: 'Tirón' },
      { movement: 'Kipping MU', start: '0', goal: 'Singles / 2-3', ratio: 'Meta' },
    ],
    weeks: WEEKS.map(stampWeek),
    createdAt: now,
    updatedAt: now,
  }
}
