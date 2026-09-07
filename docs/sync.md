# Sync con Google Drive

Código: `src/lib/pack.ts`, `src/lib/sync.ts`, `src/lib/googleAuth.ts`, `src/lib/drive.ts`, página `DriveSync`.

La cuenta es **opcional**. Sin Google la app sigue igual (todo en `localStorage`).

## Qué se copia

Un archivo en tu Drive llamado `wodplanning.pack.json` (`format: wodplanning.pack`):

- WODs (incluidos Heroes editados)
- programas y sesiones de plan
- RM
- historial

No se sube el timer en curso (`wodplanning.runSession`).

`SYNC` **sube** (sustituye el archivo de Drive). **Bajar de Drive** sustituye los datos de este dispositivo, con confirmación.

## Cómo conectar (una vez)

1. [Google Cloud Console](https://console.cloud.google.com/) → proyecto nuevo (o uno tuyo).
2. Habilita **Google Drive API**.
3. **APIs y servicios → Pantalla de consentimiento OAuth**. Tipo Externo. Añádete como usuario de prueba.
4. **Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - **Aplicación web**. Orígenes JavaScript: `http://localhost:5173`. URI de redirección: `http://localhost:5173`. Copia el Client ID (`….apps.googleusercontent.com`).
   - **Android**. Nombre de paquete: `com.wodplanning.app`. SHA-1 del keystore de debug:

     `C3:2E:8C:DF:67:6B:E2:94:09:99:83:6F:F6:66:74:92:4C:7F:F2:25`

     (Si firmas con otra clave, saca el SHA-1 de esa.)
5. En la app: icono de nube junto a WOD PLANNING → pega el **Client ID web** → Guardar → **GOOGLE**.
6. Opcional: `VITE_GOOGLE_CLIENT_ID=...` en `.env.local` y vuelve a generar la APK para no pegarlo a mano.

El Client ID de Android **no** se pega en la app; solo tiene que existir en el mismo proyecto que el web.

## UI

`#/sync` — última sync, si este dispositivo o Drive está más nuevo, Google / SYNC / bajar / cerrar sesión.
