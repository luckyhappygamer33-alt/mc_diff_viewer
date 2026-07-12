/* eslint-disable */
import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { readFileSync } from 'fs'
import { writeFileSync} from 'fs'
import icon from '../../resources/icon.png?asset'

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    show: false,
    autoHideMenuBar: true,
    icon: join(__dirname, '../../resources/icon.png'),
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Opens a native file picker filtered to .jar files
// Returns the selected file path or null if cancelled
ipcMain.handle('pick-jar', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Select Minecraft sources jar',
    filters: [{ name: 'JAR files', extensions: ['jar'] }],
    properties: ['openFile']
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// Reads a jar file as raw bytes and sends it to the renderer
// The renderer will use JSZip to parse it
ipcMain.handle('read-jar', async (_event, filePath) => {
  const buffer = readFileSync(filePath)
  return new Uint8Array(buffer)
})

// Opens a native file picker for .mcmig project files
ipcMain.handle('pick-project', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Open MC Diff Viewer project',
    filters: [{ name: 'MC Diff Viewer project', extensions: ['mcmig'] }],
    properties: ['openFile']
  })
  if (result.canceled) return null
  return result.filePaths[0]
})

// Reads a .mcmig project file and returns its contents as a string
ipcMain.handle('read-file', async (_event, filePath) => {
  return readFileSync(filePath, 'utf-8')
})

// Opens a save dialog for .mcmig project files
// Returns the chosen save path or null if cancelled
ipcMain.handle('save-project', async (_event, content) => {
  const result = await dialog.showSaveDialog({
    title: 'Save MC Diff Viewer project',
    filters: [{ name: 'MC Diff Viewer project', extensions: ['mcmig'] }],
    defaultPath: 'project.mcmig'
  })
  if (result.canceled) return null
  writeFileSync(result.filePath, content, 'utf-8')
  return result.filePath
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.cat_metalhead_mc_diff_viewer')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
