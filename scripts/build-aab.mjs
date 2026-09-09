#!/usr/bin/env node
/**
 * Builds a signed release AAB for Play Console (internal testing / production).
 * Creates android/upload-keystore.jks + keystore.properties on first run (gitignored).
 */
import { existsSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fail, resolveAndroidEnv, run } from './android-env.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'build-aab'
const { javaHome, env } = resolveAndroidEnv(root, prefix)

const storeFile = 'upload-keystore.jks'
const storePath = join(root, 'android', storeFile)
const propsPath = join(root, 'android/keystore.properties')

function ensureUploadKeystore() {
  const hasStore = existsSync(storePath)
  const hasProps = existsSync(propsPath)
  if (hasStore && hasProps) return
  if (hasStore !== hasProps) {
    fail(
      prefix,
      'android/upload-keystore.jks and android/keystore.properties must both exist. Restore the backup or delete the leftover file and run again.',
    )
  }

  const password = randomBytes(16).toString('hex')
  const keytool = join(javaHome, 'bin/keytool')
  const result = spawnSync(
    keytool,
    [
      '-genkeypair',
      '-keystore',
      storePath,
      '-alias',
      'upload',
      '-keyalg',
      'RSA',
      '-keysize',
      '2048',
      '-validity',
      '10000',
      '-storepass',
      password,
      '-keypass',
      password,
      '-dname',
      'CN=WODtoBox, O=WODtoBox, C=ES',
    ],
    { encoding: 'utf8' },
  )
  if (result.status !== 0) {
    fail(prefix, result.stderr || result.stdout || 'keytool failed')
  }

  writeFileSync(
    propsPath,
    [
      `storeFile=${storeFile}`,
      `storePassword=${password}`,
      'keyAlias=upload',
      `keyPassword=${password}`,
      '',
    ].join('\n'),
    { mode: 0o600 },
  )
  console.log(`${prefix}: created upload keystore (gitignored).`)
  console.log(`${prefix}: BACK UP android/upload-keystore.jks and android/keystore.properties — Play uploads need this key forever.`)
}

ensureUploadKeystore()

run('npm', ['run', 'android:sync'], { cwd: root, env })
run('./gradlew', ['bundleRelease'], { cwd: join(root, 'android'), env })

const aab = join(root, 'android/app/build/outputs/bundle/release/app-release.aab')
if (!existsSync(aab)) fail(prefix, `missing ${aab}`)
console.log(`${prefix}: ${aab}`)
