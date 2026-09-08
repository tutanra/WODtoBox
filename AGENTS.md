# WODtoBox — instrucciones para el agente

Documentación: `docs/README.md`. Skills del repo (`.cursor/skills/`): `wodtobox`, `wodtobox-compat`, `wodtobox-timer`, `wodtobox-wod`, `wodtobox-plan`, `wodtobox-ui`, `wodtobox-android`.

Antes de cambiar tipos, persistencia o Android:

1. Lee `docs/compatibilidad.md` y `docs/para-agentes.md`.
2. Ejecuta `npm run check:compat`.
3. Si un invariante cambia, sube `schemaVersion` en `docs/contrato.json` y escribe la migración.

No renombres claves `wodtobox.*`, `TIMER_KINDS` existentes, IDs `hero-*`, ni `com.wodotobox.app`. Mantén `HashRouter` y `base: './'`.

Ideas de escritorio/export: `docs/escritorio.md` — no implementarlas salvo petición explícita.
