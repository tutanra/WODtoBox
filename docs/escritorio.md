# Escritorio → app (ideas)

Copia entre dispositivos: [sync.md](sync.md) (`#/sync`) — Google Drive y **export/import de fichero** (`wodplanning.pack.json`). Lo de abajo sigue siendo ideas no hechas (layout de escritorio, merge por id, QR, Share nativo).

## Situación actual

- Un solo front: Vite + HashRouter. Capacitor solo envuelve `dist/` en WebView.
- Datos en `localStorage` del origen. En Chrome desktop eso **no** es el `localStorage` de la APK. Son dos silos, salvo que uses Drive o un fichero pack.
- En `#/sync` ya hay **Exportar** / **Importar** del mismo pack que Drive. Importar sustituye todo el pack local con confirmación (no merge silencioso).

Cualquier puente escritorio ↔ móvil tiene que copiar **JSON** con las mismas formas que [contrato.json](contrato.json) (`Wod[]`, `Program[]`, `SessionLog[]`), no un formato paralelo.

## Idea A — La app web es el editor; el móvil es el player

Usar el navegador en el PC (layout más ancho, teclado, PDF al lado) para montar WODs y semanas. En el móvil, timers y sesión.

El puente mínimo de fichero **ya está** en `#/sync` (mismo `wodplanning.pack`). Pendiente: merge explícito “añadir / sustituir por id” en lugar de sustituir el pack entero, y Share nativo en Android (`Filesystem` + `Share`).
## Idea B — Mismo pack, arrastre o código

- Arrastrar el JSON a la ventana web.
- QR con el pack **pequeño** (un WOD, no 12 semanas de Power Clean).
- URL `https://…/#/import?…` frágil (tamaño, privacidad). Mejor fichero.

## Idea C — Escritorio como “mesa de programación”

Pantalla split: izquierda el PDF / notas, derecha el día del plan. Atajos de teclado para series. Exporta solo el `Program` tocado, no toda la app. El móvil importa y el atleta solo pulsa Entrenar.

Útil para las plantillas: editar kilos del Power Clean en el PC una vez y mandar el programa al móvil.

## Idea D — Carpeta compartida

Un directorio (Syncthing, Nextcloud, carpeta Android) con `wods.json` y `programs.json`. La app, al arrancar, si existe el fichero y `schemaVersion` coincide, ofrece “cargar desde carpeta”. Sigue siendo pull explícito, no sync bidireccional automático (los conflictos de `SessionLog` son feos).

## Idea E — PWA instalable en el PC

`vite` + manifest. Misma app, icono en el escritorio. Sigue sin resolver el salto al Android: hace falta A o D.

## Qué no conviene

- Dos modelos de datos (uno “de escritorio” y otro móvil).
- Cuenta obligatoria solo para pasar un JSON.
- Overwrite de `wodplanning.sessions` sin preguntar (se pierde el día a medias).
- Cambiar las claves de `localStorage` para “preparar el sync”. El pack debe **mapear** a esas claves, no sustituirlas.

## Orden de implementación sugerido (resto)

1. ~~Definir `wodplanning.pack` + export/import en la web~~ (hecho: Drive + fichero en `#/sync`).
2. Layout desktop opcional (`min-width`) sin romper `max-w-lg` del timer a pantalla completa.
3. Share nativo Android / merge por id al importar.
4. Ideas B–E solo si hace falta.
