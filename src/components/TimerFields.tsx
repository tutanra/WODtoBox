import { Chip, ChipRow } from './Chips'
import { Stepper } from './Stepper'
import { ToggleRow } from './ToggleRow'
import { formatCompact, minutesOf, secondsOf, toTotalSeconds } from '../lib/format'
import type { TimerConfig } from '../types/timer'

const AMRAP_PRESETS = [5, 8, 10, 12, 15, 20, 30]
const CAP_PRESETS = [0, 8, 10, 12, 15, 20, 30]
const EMOM_INTERVALS = [30, 60, 90, 120, 180]
const ROUND_PRESETS = [8, 10, 12, 15, 20]

interface TimerFieldsProps {
  config: TimerConfig
  onChange: (config: TimerConfig) => void
}

export function TimerFields({ config, onChange }: TimerFieldsProps) {
  const kind = config.kind

  const setDuration = (minutes: number, seconds: number) => {
    const durationSeconds = toTotalSeconds(minutes, seconds)
    onChange({
      ...config,
      durationSeconds,
      countUp: durationSeconds <= 0 ? true : config.countUp,
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {kind === 'amrap' ? (
        <>
          <ChipRow>
            {AMRAP_PRESETS.map((minutes) => (
              <Chip
                key={minutes}
                label={`${minutes} min`}
                active={config.durationSeconds === minutes * 60}
                onClick={() => setDuration(minutes, 0)}
              />
            ))}
          </ChipRow>
          <div className="grid grid-cols-2 gap-3">
            <Stepper
              label="Minutos"
              value={minutesOf(config.durationSeconds)}
              min={0}
              max={99}
              onChange={(minutes) => setDuration(minutes, secondsOf(config.durationSeconds))}
            />
            <Stepper
              label="Segundos"
              value={secondsOf(config.durationSeconds)}
              min={0}
              max={59}
              step={5}
              format={(value) => String(value).padStart(2, '0')}
              onChange={(seconds) => setDuration(minutesOf(config.durationSeconds), seconds)}
            />
          </div>
        </>
      ) : null}

      {kind === 'forTime' ? (
        <>
          <ChipRow>
            {CAP_PRESETS.map((minutes) => (
              <Chip
                key={minutes}
                label={minutes === 0 ? 'Sin cap' : `${minutes} min`}
                active={config.durationSeconds === minutes * 60}
                onClick={() => setDuration(minutes, 0)}
              />
            ))}
          </ChipRow>
          {config.durationSeconds > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Stepper
                  label="Cap min"
                  value={minutesOf(config.durationSeconds)}
                  min={0}
                  max={99}
                  onChange={(minutes) => setDuration(minutes, secondsOf(config.durationSeconds))}
                />
                <Stepper
                  label="Cap seg"
                  value={secondsOf(config.durationSeconds)}
                  min={0}
                  max={59}
                  step={5}
                  format={(value) => String(value).padStart(2, '0')}
                  onChange={(seconds) => setDuration(minutesOf(config.durationSeconds), seconds)}
                />
              </div>
              <ChipRow>
                <Chip
                  label="0 → cap"
                  active={config.countUp !== false}
                  onClick={() => onChange({ ...config, countUp: true })}
                />
                <Chip
                  label="cap → 0"
                  active={config.countUp === false}
                  onClick={() => onChange({ ...config, countUp: false })}
                />
              </ChipRow>
            </>
          ) : null}
        </>
      ) : null}

      {kind === 'emom' ? (
        <>
          <ChipRow>
            {EMOM_INTERVALS.map((seconds) => (
              <Chip
                key={seconds}
                label={seconds % 60 === 0 ? `${seconds / 60} min` : formatCompact(seconds)}
                active={config.intervalSeconds === seconds}
                onClick={() => onChange({ ...config, intervalSeconds: seconds })}
              />
            ))}
          </ChipRow>
          <div className="grid grid-cols-2 gap-3">
            <Stepper
              label="Intervalo"
              value={config.intervalSeconds}
              min={10}
              max={600}
              step={5}
              format={formatCompact}
              onChange={(intervalSeconds) => onChange({ ...config, intervalSeconds })}
            />
            <Stepper
              label="Rondas"
              value={config.rounds}
              min={1}
              max={99}
              onChange={(rounds) => onChange({ ...config, rounds })}
            />
          </div>
          <ChipRow>
            {ROUND_PRESETS.map((rounds) => (
              <Chip
                key={rounds}
                label={`${rounds} r`}
                active={config.rounds === rounds}
                onClick={() => onChange({ ...config, rounds })}
              />
            ))}
          </ChipRow>
        </>
      ) : null}

      {kind === 'tabata' || kind === 'intervals' ? (
        <div className="grid grid-cols-3 gap-3">
          <Stepper
            label="Work"
            value={config.workSeconds}
            min={5}
            max={300}
            step={5}
            format={formatCompact}
            onChange={(workSeconds) => onChange({ ...config, workSeconds })}
          />
          <Stepper
            label="Rest"
            value={config.restSeconds}
            min={0}
            max={180}
            step={5}
            format={formatCompact}
            onChange={(restSeconds) => onChange({ ...config, restSeconds })}
          />
          <Stepper
            label="Rondas"
            value={config.rounds}
            min={1}
            max={40}
            onChange={(rounds) => onChange({ ...config, rounds })}
          />
        </div>
      ) : null}

      {kind === 'stopwatch' ? (
        <div className="rounded-2xl border border-line bg-panel p-4 text-sm text-mute">
          Tiempo libre, hacia arriba. Ideal para for time sin cap o para controlar descansos.
        </div>
      ) : null}

      <ToggleRow
        label="Cuenta atrás 10s"
        hint="3-2-1 clásico antes de arrancar"
        checked={config.prepareSeconds === 10}
        onChange={(checked) => onChange({ ...config, prepareSeconds: checked ? 10 : 0 })}
      />
    </div>
  )
}
