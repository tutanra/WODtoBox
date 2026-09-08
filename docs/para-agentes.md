# Para el agente (Cursor / Continuación)

Lee esto al empezar un cambio. El humano no necesita memorizarlo.

Skills: `wodplanning` (índice), `wodplanning-compat`, `wodplanning-timer`, `wodplanning-wod`, `wodplanning-plan`, `wodplanning-ui`, `wodplanning-android`.

## Antes de editar

1. [docs/README.md](README.md) — índice.
2. Si tocas timers / WODs / plan: el doc de esa zona.
3. Si tocas `src/types/*` o `src/lib/{wods,programs,sessions,history,rms,pack,sync,runSession}.ts`: [compatibilidad.md](compatibilidad.md) y [contrato.json](contrato.json).
4. Arranque: `npm run check:compat` (también en `npm run build` no está enganchado aún; córrelo a mano o vía el script de package).

## Invariantes (copia corta)

- Storage keys y `TIMER_KINDS` e IDs de plantilla (`power-clean-100`, `kipping-muscle-up`, `hero-*`): no renombrar.
- `HashRouter` + `base: './'` en Vite.
- `appId` `com.wodotobox.app`.
- Normalizers: extender, no borrar ramas legacy (`isRest`, `timerConfig` en sessionStorage, reseed de plantillas).
- `rounds` no anidados.
- No introducir backend ni cambiar a BrowserRouter “porque es más limpio”.

## Dónde va cada cosa

| Cambio | Archivo |
| --- | --- |
| Nuevo formato de timer | `types/timer.ts` (añadir al final del array), `data/kinds.ts`, `TimerFields`, `engine.ts` |
| Campo nuevo en WOD | `types/wod.ts` + default en `normalizeWod` |
| Campo nuevo en plan | `types/program.ts` + default al leer |
| Semana de plantilla | `data/powerClean100.ts` o `kippingMuscleUp.ts` (el usuario con datos viejos no se actualiza hasta Restaurar) |
| WOD Heroes | `data/heroWods.ts` + reseed en `lib/wods.ts`. No renombrar ids `hero-*`. |
| Nueva ruta | `App.tsx` solamente, hash |
| Historial de entrenos | `types/history.ts`, `lib/history.ts`, `HistoryList`, `HistoryDetail` |
| RM / máximos | `types/rm.ts`, `lib/rms.ts`, `RmList`, `RmEditor` |
| Drive / pack / fichero | `types/pack.ts`, `lib/pack.ts` (`downloadPackFile`, `readPackFromFile`), `lib/sync.ts`, `lib/googleAuth.ts`, `lib/drive.ts`, `DriveSync` |

## Verificación

- `npm run check:compat` — el contrato sigue anclado en el código.
- `npm run build` — TypeScript + Vite.
- Si cambias UI: probar en navegador el flujo tocado (timer, WOD, o plan) y, si hay Android a mano, una pasada en la APK por el botón atrás.

## Documentación

Si cambias comportamiento de usuario o un invariante, actualiza el doc de esa zona **en el mismo cambio**. Si cambia un invariante, sube `schemaVersion` y explica la migración en compatibilidad.md.

## No implementar de paso

Ideas de escritorio/export: [escritorio.md](escritorio.md). No las construyas salvo que el humano lo pida. No crees un segundo schema “por si acaso”.
