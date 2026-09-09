/**
 * Resolves Android SDK + JDK 21 for Capacitor 8 / AGP.
 * Java 17 → invalid source release 21. Java 26 → jlink / JdkImageTransform.
 */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

export function fail(prefix, message) {
  console.error(`${prefix}: ${message}`)
  process.exit(1)
}

function sdkDir(root) {
  const props = join(root, 'android/local.properties')
  if (existsSync(props)) {
    const match = readFileSync(props, 'utf8').match(/^\s*sdk\.dir\s*=\s*(.+)\s*$/m)
    if (match) return match[1].trim()
  }
  const fromEnv = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT
  if (fromEnv && existsSync(fromEnv)) return fromEnv
  const usual = join(homedir(), 'Android/sdk')
  if (existsSync(usual)) return usual
  return null
}

function javaVersion(javaHome) {
  const bin = join(javaHome, 'bin/java')
  if (!existsSync(bin)) return null
  const result = spawnSync(bin, ['-version'], { encoding: 'utf8' })
  const text = `${result.stderr || ''}${result.stdout || ''}`
  const match = text.match(/version "(\d+)/)
  return match ? Number(match[1]) : null
}

function jdk21Home() {
  const candidates = [
    process.env.JAVA_HOME,
    join(homedir(), '.local/jdk-21'),
    '/usr/lib/jvm/java-21-openjdk',
    '/usr/lib/jvm/java-21-temurin',
  ].filter(Boolean)

  for (const home of candidates) {
    if (javaVersion(home) === 21) return home
  }
  return null
}

export function resolveAndroidEnv(root, prefix) {
  const androidHome = sdkDir(root)
  if (!androidHome) {
    fail(
      prefix,
      'Android SDK not found. Set sdk.dir in android/local.properties or ANDROID_HOME. See docs/android-build.md.',
    )
  }

  const javaHome = jdk21Home()
  if (!javaHome) {
    fail(
      prefix,
      [
        'Need JDK 21 (not 17, not 26).',
        'Install Temurin 21 to ~/.local/jdk-21:',
        '  curl -fsSL -o /tmp/jdk21.tar.gz "https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jdk/hotspot/normal/eclipse?project=jdk"',
        '  mkdir -p ~/.local && tar -xzf /tmp/jdk21.tar.gz -C /tmp && mv /tmp/jdk-21* ~/.local/jdk-21',
        'See docs/android-build.md.',
      ].join('\n'),
    )
  }

  const env = {
    ...process.env,
    ANDROID_HOME: androidHome,
    ANDROID_SDK_ROOT: androidHome,
    JAVA_HOME: javaHome,
    PATH: `${join(javaHome, 'bin')}:${join(androidHome, 'platform-tools')}:${process.env.PATH || ''}`,
  }

  console.log(`${prefix}: SDK ${androidHome}`)
  console.log(`${prefix}: JDK ${javaHome} (21)`)
  return { androidHome, javaHome, env }
}

export function run(command, args, { cwd, env }) {
  const result = spawnSync(command, args, { cwd, env, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
