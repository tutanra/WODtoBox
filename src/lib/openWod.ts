import { registerPlugin, type PluginListenerHandle } from '@capacitor/core'

export interface OpenWodFile {
  text?: string
  error?: string
}

export interface OpenWodPlugin {
  consumePending(): Promise<OpenWodFile>
  addListener(
    eventName: 'openFile',
    listenerFunc: (event: OpenWodFile) => void,
  ): Promise<PluginListenerHandle>
}

export const OpenWod = registerPlugin<OpenWodPlugin>('OpenWod')
