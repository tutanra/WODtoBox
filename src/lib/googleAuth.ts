import { Capacitor } from '@capacitor/core'
import { getGoogleClientId } from './sync'

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file'
const EXTRA_SCOPES = [
  DRIVE_SCOPE,
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

export interface GoogleSession {
  accessToken: string
  expiresAt: number
  email: string
  name: string
}

const SESSION_KEY = 'wodplanning.googleSession'

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            prompt?: string
            callback: (response: { access_token?: string; expires_in?: number; error?: string }) => void
            error_callback?: (error: { type?: string; message?: string }) => void
          }) => TokenClient
          revoke: (token: string, done?: () => void) => void
        }
      }
    }
  }
}

function readSession(): GoogleSession | null {
  const raw = sessionStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as GoogleSession
    if (!parsed.accessToken || parsed.expiresAt < Date.now() + 15_000) return null
    return parsed
  } catch {
    return null
  }
}

function writeSession(session: GoogleSession | null) {
  if (!session) sessionStorage.removeItem(SESSION_KEY)
  else sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
}

export function currentGoogleSession() {
  return readSession()
}

async function loadGis() {
  if (window.google?.accounts?.oauth2) return
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector('script[data-gis="1"]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('No se pudo cargar Google')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.dataset.gis = '1'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('No se pudo cargar Google'))
    document.head.appendChild(script)
  })
}

async function userinfo(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!response.ok) return { email: '', name: '' }
  const json = (await response.json()) as { email?: string; name?: string }
  return { email: json.email ?? '', name: json.name ?? '' }
}

async function signInWeb(clientId: string): Promise<GoogleSession> {
  await loadGis()
  const oauth = window.google?.accounts.oauth2
  if (!oauth) throw new Error('Google no está disponible en este navegador')

  const token = await new Promise<{ access_token: string; expires_in: number }>((resolve, reject) => {
    let settled = false
    let closedTimer = 0
    let timeoutId = 0
    const finish = (fn: () => void) => {
      if (settled) return
      settled = true
      window.clearTimeout(closedTimer)
      window.clearTimeout(timeoutId)
      fn()
    }
    const client = oauth.initTokenClient({
      client_id: clientId,
      scope: EXTRA_SCOPES.join(' '),
      prompt: 'consent',
      callback: (response) => {
        if (response.error || !response.access_token) {
          finish(() => reject(new Error('No se concedió acceso a Drive')))
          return
        }
        finish(() =>
          resolve({
            access_token: response.access_token!,
            expires_in: response.expires_in ?? 3600,
          }),
        )
      },
      error_callback: (error) => {
        const type = error.type ?? ''
        if (type === 'popup_closed') {
          // GIS dispara esto al cerrar el popup también cuando el usuario ya ha aprobado;
          // el token suele llegar al callback un instante después.
          closedTimer = window.setTimeout(() => {
            finish(() => reject(new Error('Se canceló el inicio de sesión')))
          }, 2000)
          return
        }
        if (type === 'popup_failed_to_open') {
          finish(() =>
            reject(new Error('El navegador bloqueó la ventana de Google. Permite las ventanas emergentes.')),
          )
          return
        }
        finish(() => reject(new Error(error.message || 'No se pudo entrar con Google')))
      },
    })
    client.requestAccessToken({ prompt: 'consent' })
    timeoutId = window.setTimeout(() => {
      finish(() => reject(new Error('Google no respondió. Revisa el Client ID y vuelve a intentar.')))
    }, 90_000)
  })

  const profile = await userinfo(token.access_token)
  return {
    accessToken: token.access_token,
    expiresAt: Date.now() + token.expires_in * 1000,
    email: profile.email,
    name: profile.name,
  }
}

function tokenFromNative(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value
  if (typeof value === 'object' && 'token' in value && typeof (value as { token: unknown }).token === 'string') {
    return (value as { token: string }).token
  }
  return null
}

async function signInNative(clientId: string): Promise<GoogleSession> {
  const { SocialLogin } = await import('@capgo/capacitor-social-login')
  await SocialLogin.initialize({
    google: { webClientId: clientId, mode: 'online' },
  })
  const response = await SocialLogin.login({
    provider: 'google',
    options: {
      scopes: EXTRA_SCOPES,
      filterByAuthorizedAccounts: false,
      forceRefreshToken: true,
      prompt: 'consent',
    },
  })
  const result = response.result
  if (!('responseType' in result) || result.responseType !== 'online') {
    throw new Error('Google no devolvió un token de Drive')
  }
  const accessToken = tokenFromNative(result.accessToken)
  if (!accessToken) throw new Error('Falta el token de Drive. Revisa el Client ID web en Google Cloud.')
  const email = result.profile.email ?? ''
  const name = result.profile.name ?? email
  return {
    accessToken,
    expiresAt: Date.now() + 50 * 60 * 1000,
    email,
    name,
  }
}

export async function googleSignIn(): Promise<GoogleSession> {
  const clientId = getGoogleClientId()
  if (!clientId) throw new Error('Falta el Client ID de Google')
  const session = Capacitor.isNativePlatform() ? await signInNative(clientId) : await signInWeb(clientId)
  writeSession(session)
  return session
}

export async function googleSignOut() {
  const session = readSession()
  writeSession(null)
  if (Capacitor.isNativePlatform()) {
    try {
      const { SocialLogin } = await import('@capgo/capacitor-social-login')
      await SocialLogin.logout({ provider: 'google' })
    } catch {
      /* ignore */
    }
    return
  }
  if (session?.accessToken && window.google?.accounts.oauth2) {
    await new Promise<void>((resolve) => {
      window.google?.accounts.oauth2.revoke(session.accessToken, () => resolve())
      window.setTimeout(() => resolve(), 1500)
    })
  }
}

export async function requireGoogleSession() {
  const existing = readSession()
  if (existing) return existing
  return googleSignIn()
}
