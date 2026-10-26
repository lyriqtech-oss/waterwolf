const test = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { createUpdateService } = require('../electron/updates.cjs');

test('installed Windows app checks automatically, but requires explicit download and install', async () => {
  const updater = new EventEmitter();
  let checks = 0, downloads = 0, installs = 0, startupCheck;
  updater.checkForUpdates = async () => { checks++; updater.emit('update-available', { version: '0.3.0' }); };
  updater.downloadUpdate = async () => { downloads++; updater.emit('download-progress', { percent: 52.4 }); updater.emit('update-downloaded', { version: '0.3.0' }); };
  updater.quitAndInstall = () => { installs++; };
  const service = createUpdateService({
    app: { isPackaged: true, getVersion: () => '0.2.0' }, updater, platform: 'win32', emit: () => {},
    schedule: callback => { startupCheck = callback; }, repeat: () => {}
  });
  service.start();
  assert.equal(updater.autoDownload, false);
  assert.equal(updater.autoInstallOnAppQuit, false);
  assert.equal(installs, 0);
  assert.equal(downloads, 0);
  await startupCheck();
  assert.equal(checks, 1);
  assert.equal(service.status().status, 'available');
  assert.equal(downloads, 0);
  assert.equal(service.install(), false);
  await service.download();
  assert.equal(downloads, 1);
  assert.equal(service.status().status, 'ready');
  assert.equal(installs, 0);
  assert.equal(service.install(), true);
  assert.equal(installs, 1);
});

test('portable and development builds never start an updater check', async () => {
  for (const app of [{ isPackaged: false, getVersion: () => '0.2.0' }, { isPackaged: true, getVersion: () => '0.2.0' }]) {
    let scheduled = false;
    const service = createUpdateService({ app, updater: new EventEmitter(), platform: 'win32', portable: app.isPackaged, emit: () => {}, schedule: () => { scheduled = true; }, repeat: () => {} });
    service.start();
    assert.equal(service.status().status, 'unavailable');
    assert.equal(scheduled, false);
    assert.equal(service.install(), false);
  }
});
