const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const net = require('net');

let mainWindow;
let splashWindow;
let backendProcess;

const USER_DATA = app.getPath('userData');
const DESKTOP = app.getPath('desktop');
const DB_DIR = path.join(USER_DATA, 'data');
const BACKUP_DIR = path.join(DB_DIR, 'backups');

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });
if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

function getIcon() {
  const candidates = [
    path.join(process.resourcesPath, 'BureauIcon.png'),
    path.join(__dirname, '../frontend/public/BureauIcon.png'),
  ];
  for (const c of candidates) { if (fs.existsSync(c)) return c; }
  return null;
}

function getNodeAndServer() {
  const isPacked = app.isPackaged;
  let nodePath, serverPath;
  if (isPacked) {
    nodePath = path.join(process.resourcesPath, 'node', 'node.exe');
    serverPath = path.join(process.resourcesPath, 'backend', 'server.js');
  } else {
    nodePath = path.join(__dirname, '../portable-node/node-v20.18.0-win-x64/node.exe');
    serverPath = path.join(__dirname, '../backend/server.js');
  }
  return { nodePath, serverPath };
}

function startBackend() {
  const { nodePath, serverPath } = getNodeAndServer();
  if (!fs.existsSync(nodePath) || !fs.existsSync(serverPath)) { console.error('Not found!'); return; }
  backendProcess = spawn(nodePath, [serverPath], {
    env: { ...process.env, DB_PATH: DB_DIR, PORT: '3001' },
    windowsHide: true,
    cwd: path.dirname(serverPath)
  });
  backendProcess.stdout.on('data', d => console.log('Backend:', d.toString()));
  backendProcess.stderr.on('data', d => console.error('Backend error:', d.toString()));
  backendProcess.on('error', e => console.error('Failed:', e.message));
}

function desktopBackup() {
  try {
    const src = path.join(DB_DIR, 'kingdom-gym.db');
    const dst = path.join(DESKTOP, 'KingdomGym-Backup.db');
    if (fs.existsSync(src)) fs.copyFileSync(src, dst);
  } catch(e) {}
}

function waitForBackend(retries, callback) {
  const client = new net.Socket();
  client.connect(3001, '127.0.0.1', () => { client.destroy(); callback(); });
  client.on('error', () => {
    client.destroy();
    if (retries > 0) setTimeout(() => waitForBackend(retries - 1, callback), 400);
    else callback();
  });
}

function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 360,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    center: true,
    icon: getIcon(),
    webPreferences: { nodeIntegration: false }
  });
  const splashPath = app.isPackaged
    ? path.join(process.resourcesPath, 'splash.html')
    : path.join(__dirname, 'splash.html');
  splashWindow.loadFile(splashPath);
  splashWindow.center();
}

function createMainWindow() {
  const icon = getIcon();
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    icon: icon,
    title: "Kingdom Gym Manager",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js"),
      spellcheck: false,
      backgroundThrottling: false
    },
    backgroundColor: "#0A0A0A",
    show: false
  });
  mainWindow.setMenuBarVisibility(false);
  waitForBackend(40, () => {
    mainWindow.loadURL("http://127.0.0.1:3001");
    mainWindow.once("ready-to-show", () => {
      if (splashWindow && !splashWindow.isDestroyed()) { splashWindow.close(); splashWindow = null; }
      mainWindow.show();
      mainWindow.setFullScreen(true);
      mainWindow.focus();
    });
  });
  mainWindow.webContents.on('did-fail-load', () => {
    setTimeout(() => waitForBackend(10, () => mainWindow.loadURL('http://127.0.0.1:3001')), 1000);
  });
}

app.whenReady().then(() => {
  app.commandLine.appendSwitch('disable-renderer-backgrounding');
  app.commandLine.appendSwitch('disable-background-timer-throttling');
  startBackend();
  createSplash();
  createMainWindow();
  desktopBackup();
});

app.on('window-all-closed', () => {
  desktopBackup();
  if (backendProcess) backendProcess.kill();
  app.quit();
});

ipcMain.handle('backup-now', async () => {
  try {
    const src = path.join(DB_DIR, 'kingdom-gym.db');
    const dst = path.join(DESKTOP, 'KingdomGym-Backup.db');
    fs.copyFileSync(src, dst);
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('restore-db', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Selectionner le fichier de sauvegarde',
    filters: [{ name: 'Base de donnees', extensions: ['db'] }],
    properties: ['openFile']
  });
  if (result.canceled) return { success: false };
  try {
    const src = result.filePaths[0];
    const dst = path.join(DB_DIR, 'kingdom-gym.db');
    const bak = path.join(DB_DIR, 'kingdom-gym-before-restore.db');
    if (fs.existsSync(dst)) fs.copyFileSync(dst, bak);
    fs.copyFileSync(src, dst);
    return { success: true };
  } catch(e) { return { success: false, error: e.message }; }
});

ipcMain.handle('minimize-app', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.handle('toggle-fullscreen', () => {
  if (!mainWindow) return;
  const isFull = mainWindow.isFullScreen();
  mainWindow.setFullScreen(!isFull);
});
ipcMain.handle('toggle-maximize', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.setFullScreen(true);
});