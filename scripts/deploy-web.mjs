#!/usr/bin/env node
/**
 * Build Vite → dist/ and upload to the VPS as WEB_DEPLOY_USER (default javi).
 * Prefer rsync; if missing, tar over ssh. Dir should be owned by that user (no sudo).
 * See docs/deploy-web.md.
 */
import { existsSync, readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const prefix = 'deploy-web'

function fail(message) {
  console.error(`${prefix}: ${message}`)
  process.exit(1)
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return
  for (const line of readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    cwd: root,
    ...opts,
  })
  if (result.error) fail(result.error.message)
  if (result.status !== 0) fail(`falló ${command} ${args.join(' ')}`)
}

function hasBin(name) {
  return spawnSync('which', [name], { encoding: 'utf8' }).status === 0
}

function requireEnv(name) {
  const value = process.env[name]?.trim()
  if (!value) fail(`falta ${name} (ponlo en .env; ver docs/deploy-web.md)`)
  return value
}

function ensureTrailingSlash(path) {
  return path.endsWith('/') ? path : `${path}/`
}

function stripTrailingSlash(path) {
  return path.replace(/\/+$/, '') || '/'
}

loadEnvFile(join(root, '.env'))

const user = process.env.WEB_DEPLOY_USER?.trim() || 'javi'
const host = process.env.WEB_DEPLOY_HOST?.trim() || 'jc-applabs.com'
const remotePath = ensureTrailingSlash(requireEnv('WEB_DEPLOY_PATH'))
const remoteDir = stripTrailingSlash(remotePath)
const port = process.env.WEB_DEPLOY_PORT?.trim() || '22'
const identity = process.env.WEB_DEPLOY_SSH_KEY?.trim()
const publicUrl = process.env.WEB_DEPLOY_URL?.trim()
const rsyncPath = process.env.WEB_DEPLOY_RSYNC_PATH?.trim()

if (!hasBin('ssh')) fail('hace falta `ssh` en el PATH')
if (!hasBin('tar')) fail('hace falta `tar` en el PATH')

console.log(`${prefix}: npm run build`)
run('npm', ['run', 'build'])

const dist = join(root, 'dist')
if (!existsSync(join(dist, 'index.html'))) fail('dist/index.html no existe tras el build')

const sshArgs = ['-o', 'BatchMode=yes', '-p', port]
if (identity) {
  if (!existsSync(identity)) fail(`WEB_DEPLOY_SSH_KEY no existe: ${identity}`)
  sshArgs.push('-i', identity)
}

const remote = `${user}@${host}:${remotePath}`
const sshTarget = `${user}@${host}`

if (hasBin('rsync')) {
  const sshCmd = ['ssh', ...sshArgs].join(' ')
  const rsyncArgs = ['-avz', '--delete', '-e', sshCmd]
  if (rsyncPath) rsyncArgs.push('--rsync-path', rsyncPath)
  rsyncArgs.push(ensureTrailingSlash(dist), remote)
  console.log(`${prefix}: rsync → ${remote}`)
  run('rsync', rsyncArgs)
} else {
  console.log(`${prefix}: tar+ssh → ${sshTarget}:${remoteDir} (instala rsync para sync incremental)`)
  if (/['\\]/.test(remoteDir)) fail('WEB_DEPLOY_PATH no puede contener comillas ni barras invertidas')
  const packed = spawnSync('tar', ['-C', dist, '-cf', '-', '.'], {
    encoding: 'buffer',
    maxBuffer: 256 * 1024 * 1024,
  })
  if (packed.error) fail(packed.error.message)
  if (packed.status !== 0) fail('tar local falló')
  const remoteCmd = `mkdir -p '${remoteDir}' && find '${remoteDir}' -mindepth 1 -delete && tar -C '${remoteDir}' -xf -`
  const uploaded = spawnSync('ssh', [...sshArgs, sshTarget, remoteCmd], {
    input: packed.stdout,
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  if (uploaded.error) fail(uploaded.error.message)
  if (uploaded.status !== 0) fail('subida tar+ssh falló')
}

const url = publicUrl || `http://${host}/wodtobox/`
console.log(`${prefix}: listo → ${url}`)
