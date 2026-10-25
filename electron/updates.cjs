const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const FIRST_CHECK_MS = 15 * 1000;

function createUpdateService({ app, updater, emit, portable = false, platform = process.platform, schedule = setTimeout, repeat = setInterval }) {
  const supported = platform === 'win32' && app.isPackaged && !portable;
  let state = { status: supported ? 'idle' : 'unavailable', currentVersion: app.getVersion(), availableVersion: null, progress: 0, message: supported ? 'Updates are checked automatically.' : 'Updates require the installed Windows app.' };
  let checking = false;
  let started = false;
  function publish(patch) { state = { ...state, ...patch }; emit({ ...state }); }

  async function check() {
    if (!supported || checking || state.status === 'ready' || state.status === 'downloading') return { ...state };
    checking = true;
    publish({ status: 'checking', message: 'Checking for updates…' });
    try { await updater.checkForUpdates(); }
    catch { publish({ status: 'error', message: 'Could not check for updates. Try again later.' }); }
    finally { checking = false; }
    return { ...state };
  }

  function start() {
    if (!supported || started) return;
    started = true;
    updater.autoDownload = false;
    updater.autoInstallOnAppQuit = false;
    updater.allowPrerelease = false;
    updater.allowDowngrade = false;
    updater.on('update-available', info => publish({ status: 'available', availableVersion: info.version, progress: 0, message: `WaterWolf ${info.version} is available.` }));
    updater.on('download-progress', info => publish({ status: 'downloading', progress: Math.min(100, Math.max(0, Math.round(info.percent || 0))), message: `Downloading WaterWolf ${state.availableVersion || 'update'}…` }));
    updater.on('update-downloaded', info => publish({ status: 'ready', availableVersion: info.version, progress: 100, message: `WaterWolf ${info.version} is ready to install.` }));
    updater.on('update-not-available', () => publish({ status: 'current', availableVersion: null, progress: 0, message: 'WaterWolf is up to date.' }));
    updater.on('error', () => publish({ status: 'error', message: 'Could not complete the update. Try again later.' }));
    schedule(() => void check(), FIRST_CHECK_MS);
    repeat(() => void check(), CHECK_INTERVAL_MS);
  }

  async function download() {
    if (!supported || state.status !== 'available') return { ...state };
    publish({ status: 'downloading', progress: 0, message: `Downloading WaterWolf ${state.availableVersion}…` });
    try { await updater.downloadUpdate(); }
    catch { publish({ status: 'error', message: 'Could not download the update. Try again later.' }); }
    return { ...state };
  }

  function install() {
    if (!supported || state.status !== 'ready') return false;
    updater.quitAndInstall(false, true);
    return true;
  }

  return { start, check, download, install, status: () => ({ ...state }) };
}

module.exports = { createUpdateService };
