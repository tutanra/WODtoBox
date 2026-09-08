import { Capacitor } from '@capacitor/core'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'

export function shareFilename(name: string, ext = 'wodtobox') {
  const slug = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
  return `${slug || 'wod'}.${ext}`
}

function isShareCanceled(err: unknown) {
  if (!err || typeof err !== 'object') return false
  const name = 'name' in err && typeof err.name === 'string' ? err.name : ''
  const message = 'message' in err && typeof err.message === 'string' ? err.message : ''
  return name === 'AbortError' || /cancel/i.test(message)
}

async function shareNativeFile(file: File) {
  await Filesystem.writeFile({
    path: file.name,
    data: await file.text(),
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  })
  const { uri } = await Filesystem.getUri({
    path: file.name,
    directory: Directory.Cache,
  })
  await Share.share({
    title: 'WODtoBox',
    files: [uri],
    dialogTitle: 'Compartir',
  })
}

function downloadFile(file: File) {
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = file.name
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export async function shareOrDownloadFile(file: File) {
  if (Capacitor.isNativePlatform()) {
    try {
      await shareNativeFile(file)
      return
    } catch (err) {
      if (isShareCanceled(err)) return
      throw err
    }
  }
  downloadFile(file)
}
