# WOD Planning — instrucciones para el agente

Documentación: `docs/README.md`. Skills del repo (`.cursor/skills/`): `wodplanning`, `wodplanning-compat`, `wodplanning-timer`, `wodplanning-wod`, `wodplanning-plan`, `wodplanning-ui`, `wodplanning-android`.

Antes de cambiar tipos, persistencia o Android:

1. Lee `docs/compatibilidad.md` y `docs/para-agentes.md`.
2. Ejecuta `npm run check:compat`.
3. Si un invariante cambia, sube `schemaVersion` en `docs/contrato.json` y escribe la migración.

No renombres claves `wodplanning.*`, `TIMER_KINDS` existentes, IDs `power-clean-100` / `kipping-muscle-up`, ni `com.wodplanning.app`. Mantén `HashRouter` y `base: './'`.

Ideas de escritorio/export: `docs/escritorio.md` — no implementarlas salvo petición explícita.
