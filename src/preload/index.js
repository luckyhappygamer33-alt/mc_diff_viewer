/* eslint-disable */
import { contextBridge, ipcRenderer } from 'electron'

const safeInvoke = async (channel, ...args) => {
  try {
    return await ipcRenderer.invoke(channel, ...args)
  } catch (error) {
    console.error(`IPC error on channel '${channel}':`, error)
    return null
  }
}

contextBridge.exposeInMainWorld('api', {
  pickJar: () => safeInvoke('pick-jar'),
  readJar: (filePath) => safeInvoke('read-jar', filePath),
  pickProject: () => safeInvoke('pick-project'),
  readFile: (filePath) => safeInvoke('read-file', filePath),
  saveProject: (content) => safeInvoke('save-project', content)
})
