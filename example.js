import createMsi from './index.js';

const options = {
  name: 'Oneclick Agent',
  upgradeCode: 'YOUR-GUID-HERE',
  version: '1.0.0',
  manufacturer: 'oneclick AG',
  source: '/home/alexander/Documents/Agent packer/Oneclick Agent',
  output: '/home/alexander/Documents/Agent packer/test.msi',
  iconPath: '/home/alexander/Documents/Agent packer/icon.ico',
  runAfterInstall: 'start.cmd',
  // runBeforeUninstall: 'delete.cmd',
  arch: 'x64',
  // enableUi: true,
};

createMsi(options, (err) => {
  if (err) {
    throw err;
  }

  // eslint-disable-next-line no-console
  console.log(`Output to ${options.output}`);
});
