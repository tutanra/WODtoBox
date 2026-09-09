#!/usr/bin/env node
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveAndroidEnv, run } from './android-env.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const { env } = resolveAndroidEnv(root, 'build-apk')

run('npm', ['run', 'android:sync'], { cwd: root, env })
run('./gradlew', ['assembleDebug'], { cwd: join(root, 'android'), env })

const apk = join(root, 'android/app/build/outputs/apk/debug/app-debug.apk')
console.log(`build-apk: ${apk}`)
