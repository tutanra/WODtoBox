# Documentación de WODtoBox

Índice para humanos y para el agente. Si vas a cambiar datos, tipos o Android, lee primero [compatibilidad](compatibilidad.md) y ejecuta `npm run check:compat`.

| Doc | Para qué |
| --- | --- |
| [producto.md](producto.md) | Qué es la app y flujos de uso, pantalla a pantalla |
| [timers.md](timers.md) | Los 6 formatos y el motor de cuenta |
| [wods.md](wods.md) | WODs grabados, bloques y overlay |
| [plan.md](plan.md) | Planificaciones, sesión y las dos plantillas semana a semana |
| [rm.md](rm.md) | Pesos máximos (ejercicio, reps, kilos) |
| [historial.md](historial.md) | Entrenos terminados (WODs, días de plan y RM) |
| [arquitectura.md](arquitectura.md) | Stack, rutas, archivos, persistencia |
| [compatibilidad.md](compatibilidad.md) | Qué no se puede romper y cómo migrar |
| [sync.md](sync.md) | Copia opcional a Google Drive |
| [para-agentes.md](para-agentes.md) | Instrucciones cortas para continuar el código |
| [contrato.json](contrato.json) | Contrato machine-readable; `scripts/check-compat.mjs` lo comprueba contra el código |
| [android-build.md](android-build.md) | JDK 21, SDK y cómo generar la APK sin repetir palos |

Skills de Cursor (el agente las carga según la tarea): `.cursor/skills/wodplanning*` — arranque, compat, timer, WOD, plan, UI, Android.

El README de la raíz resume la app. Aquí está el detalle operativo.
