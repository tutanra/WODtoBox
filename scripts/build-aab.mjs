#!/usr/bin/env node
/**
 * Builds a signed release AAB for Play Console (com.wodtobox.app).
 * Uses android/wodtobox-upload.jks — never the old upload-keystore.jks (com.wodotobox.app).
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fail, resolveAndroidEnv, run } from './android-env.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'build-aab'
const { javaHome, env } = resolveAndroidEnv(root, prefix)

const storeFile = 'wodtobox-upload.jks'
const storePath = join(root, 'android', storeFile)
const propsPath = join(root, 'android/keystore.properties')
const oldStorePath = join(root, 'android/upload-keystore.jks')
const oldPropsBak = join(root, 'android/keystore.properties.wodotobox.bak')

function propsStoreFile() {
  if (!existsSync(propsPath)) return null
  const match = readFileSync(propsPath, 'utf8').match(/^\s*storeFile\s*=\s*(.+)\s*$/m)
  return match ? match[1].trim() : null
}

function ensureUploadKeystore() {
  const current = propsStoreFile()
  if (existsSync(storePath) && current === storeFile) return

  if (current && current !== storeFile && existsSync(propsPath) && !existsSync(oldPropsBak)) {
    copyFileSync(propsPath, oldPropsBak)
    console.log(`${prefix}: backed up old com.wodotobox.app keystore props to ${oldPropsBak}`)
  }
  if (existsSync(oldStorePath)) {
    console.log(`${prefix}: leaving ${oldStorePath} untouched (old Play app)`)
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
  console.log(`${prefix}: created ${storeFile} (gitignored).`)
  console.log(`${prefix}: BACK UP android/${storeFile} and android/keystore.properties — Play uploads need this key forever.`)
}

ensureUploadKeystore()

run('npm', ['run', 'android:sync'], { cwd: root, env })
run('./gradlew', ['bundleRelease'], { cwd: join(root, 'android'), env })

const aab = join(root, 'android/app/build/outputs/bundle/release/app-release.aab')
if (!existsSync(aab)) fail(prefix, `missing ${aab}`)
console.log(`${prefix}: ${aab}`)
