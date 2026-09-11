# Sync con Google Drive

Código: `src/lib/pack.ts`, `src/lib/sync.ts`, `src/lib/googleAuth.ts`, `src/lib/drive.ts`, `src/lib/migrate.ts`, página `DriveSync`.

La cuenta es **opcional**. Sin Google la app sigue igual (todo en `localStorage`).

## Qué se copia

Un archivo en tu Drive llamado `wodtobox.pack.json` (`format: wodtobox.pack`), dentro de una carpeta **WODtoBox** que crea la app si no existe:

- WODs (incluidos Heroes editados)
- programas y sesiones de plan
- RM
- historial

No se sube el timer en curso (`wodtobox.runSession`).

La app usa el ámbito `drive.file`: solo ve archivos que ella misma creó. No puede listar el resto de tus carpetas, así que no hay un selector de «cualquier carpeta de Drive». Si mueves `wodtobox.pack.json` a otra carpeta en la web de Drive, las siguientes **SYNC** actualizan ese mismo archivo (sigue donde lo dejaste). Un archivo que ya estaba en Mi unidad no se mueve solo. Si aún existe `wodplanning.pack.json` de una versión anterior, se lee y al subir se renombra.

`SYNC` hace la dirección que encaja con el estado: si este dispositivo está más nuevo (o no hay copia), **sube**; si Drive está más nuevo, **baja** (con confirmación). Debajo, el otro sentido: **Bajar copia de Drive** (si este dispositivo va por delante) o **Subir copia a Drive** (si Drive va por delante). Subir cuando Drive está más nuevo también pide confirmación, porque machaca la copia remota.

La comparación solo usa el pack que se acaba de leer. Si el archivo ya no está, se olvida el `driveDataAt` guardado: si no, la pantalla decía que Drive era más nuevo, **SYNC** no podía bajar (no hay pack) y dejaba activo **Subir copia a Drive**. Si no se puede leer Drive, el estado lo dice y **SYNC** reintenta.

En la misma pantalla, **Exportar** / **Importar** copian ese pack a un fichero local (`wodtobox.pack.json`) sin cuenta. Importar sustituye los datos de este dispositivo (con confirmación), igual que bajar de Drive. Un pack viejo (`wodplanning.pack`) también entra. El timer en curso no se toca. En el móvil, exportar puede abrir la hoja de compartir si el sistema lo permite.

La comparación local/Drive usa `dataAt`: el `updatedAt` más reciente de WODs, planes, sesiones, historial y RM **del usuario**. Los WOD Heroes recién reinsertados (tras un borrado local) no cuentan: si no, el dispositivo parecería más nuevo que Drive solo porque se han vuelto a sembrar.

El icono de papelera en `#/sync` deja elegir qué borrar, con confirmación:

- **Este dispositivo** — WODs, plan, RM, historial y sesiones locales. WOD Heroes vuelven al original. Drive no se toca. Se olvida `lastSyncAt` / dirección: la pantalla ya no muestra esa sync como si este dispositivo siguiera al día.
- **Copia en Drive** — borra `wodtobox.pack.json` (y el pack viejo, si queda) de tu Drive. Este dispositivo no se toca. Hace falta sesión de Google.

El Client ID web va integrado (`VITE_GOOGLE_CLIENT_ID` / `GOOGLE_WEB_CLIENT_ID`). En `#/sync` se pulsa **GOOGLE**; no hay que pegar credenciales. El Client ID de Android no se usa en código: Google lo empareja por paquete `com.wodtobox.app` y SHA-1. Hay que dar de alta ese paquete (no `com.wodotobox.app`) en Google Cloud.

En Android, `MainActivity` implementa el hook de Capgo Social Login; sin eso, pedir `drive.file` falla con *You CANNOT use scopes without modifying the main activity*.

SHA-1 de la clave de **subida** (APK local `npm run apk` y AAB `npm run aab`, misma keystore): `9A:FF:2C:CC:F0:5F:35:78:58:F8:6F:71:9A:7A:0C:2C:AC:0A:57:22`. Play vuelve a firmar lo que instalan los testers: hay que registrar **los tres** SHA-1 de los `.der` (Protegida con Play → Firma de aplicaciones de Play → descargar certificados): despliegue `F4:A9:6B:AF:B5:87:AD:B8:2F:2C:E6:E0:94:7D:51:67:5E:37:36:AE`, clásica híbrida `47:11:C6:D5:F7:45:ED:EC:E9:D1:1E:6F:42:C1:9F:F0:EA:C2:FD:FF` y poscuántica `82:5F:84:71:D5:F1:5A:B2:A4:F3:FF:9D:1B:4B:6C:96:BA:84:6C:FE`. Un cliente OAuth Android por SHA-1, paquete `com.wodtobox.app`, mismo proyecto que el Client ID web. Es SHA-1, no SHA-256.

Si Google dice que la app no está verificada: en Prueba solo funcionan los **usuarios de prueba**. `drive.file` es un ámbito sensible; para el público hace falta verificación. Para uso propio, Prueba + tu correo basta.

Prueba el login en Chrome o Firefox en `http://localhost:5173` (no en `127.0.0.1`). El cliente OAuth web debe tener ese origen. GIS cierra el popup al aprobar; eso no es una cancelación.

## UI

`#/sync` — última sync, carpeta de la copia, si este dispositivo o Drive está más nuevo, Google / SYNC / Bajar copia de Drive o Subir copia a Drive / exportar e importar fichero / papelera (borrar local o Drive) / cerrar sesión.
