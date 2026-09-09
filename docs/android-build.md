# Generar APK (debug) y AAB (Play)

## APK debug (sideload)

Salida: `android/app/build/outputs/apk/debug/app-debug.apk`.

```bash
npm run apk
```

Eso corre `scripts/build-apk.mjs`: localiza el SDK y **JDK 21**, hace `android:sync` (Vite + `cap sync`) y `./gradlew assembleDebug`.

## AAB firmado (Play Console)

Salida: `android/app/build/outputs/bundle/release/app-release.aab`.

Versión en `android/app/build.gradle`: `versionCode` / `versionName` (hoy **3** / **1.0**). Play lee el `versionCode` del bundle; en cada subida nueva hay que subirlo.

El release usa R8 (`minifyEnabled true`). El mapping de desofuscación va **dentro** del AAB; Play Console lo toma solo. No hace falta subirlo a mano.

```bash
npm run aab
```

Eso corre `scripts/build-aab.mjs`: mismo JDK 21 y SDK, crea la clave de subida si no existe, `android:sync` y `./gradlew bundleRelease`.

La primera vez genera (fuera de git):

- `android/upload-keystore.jks` — clave de subida a Play
- `android/keystore.properties` — alias y contraseñas

**Copia esos dos ficheros a un sitio seguro.** Sin ellos no se pueden firmar más AAB con la misma clave. En Play Console, deja que Google gestione la clave de firma de la app (Play App Signing) y usa esta keystore solo como clave de subida.

Política de privacidad (ficha de Play): [privacidad.html](privacidad.html). En GitHub Pages:
`https://tutanra.github.io/WODtoBox/`


## Entorno en esta máquina

| Qué | Dónde |
| --- | --- |
| Android SDK | `android/local.properties` → `sdk.dir=/home/javi/Android/sdk` (también `~/Android/sdk`) |
| JDK 21 | `~/.local/jdk-21` (Temurin 21). El default de Arch es Java **26** y hay un 17; **ninguno vale**. |

Capacitor 8 / Android Gradle Plugin pide `source release 21`. Con Java 17: `invalid source release: 21`. Con Java 26: falla `jlink` / `JdkImageTransform`.

`local.properties` no se commitea. El script lee `sdk.dir` si existe, si no `ANDROID_HOME` / `~/Android/sdk`.

## Si falta JDK 21

No hace falta `sudo`. Temurin en `~/.local/jdk-21`:

```bash
curl -fsSL -o /tmp/jdk21.tar.gz "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse?project=jdk"
mkdir -p ~/.local
tar -xzf /tmp/jdk21.tar.gz -C /tmp
rm -rf ~/.local/jdk-21
mv /tmp/jdk-21* ~/.local/jdk-21
```

En Arch también existe `jdk21-openjdk` (`/usr/lib/jvm/java-21-openjdk`) si se puede instalar con pacman.

## Primera vez / SDK

Hace falta Android SDK (platforms 35/36, build-tools) y `ANDROID_HOME` o `sdk.dir`. El proyecto nativo ya está en `android/` (`npm run android:add` solo si se borra).

```bash
npx cap open android   # Android Studio, opcional
```
