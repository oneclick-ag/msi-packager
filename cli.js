#!/usr/bin/env node

const path = require('path');
const nomnom = require('nomnom');
const packageMsi = require('.');

const opts = nomnom()
  .script('msi-packager')
  .options({

    source: {
      position: 0,
      help: 'Directory containing app to package',
      required: true,
    },

    output: {
      position: 1,
      help: 'write output .msi to this path',
      required: true,
    },

    name: {
      abbr: 'n',
      required: true,
    },

    version: {
      abbr: 'v',
      help: 'Specify application version',
      required: true,
    },

    manufacturer: {
      abbr: 'm',
      required: true,
    },

    arch: {
      abbr: 'a',
      help: 'Specify the target architecture: x86 or x64 (optional)',
    },

    upgradeCode: {
      abbr: 'u',
      full: 'upgrade-code',
      help: 'Specify GUID to use for upgrading from other versions',
      required: true,
    },

    iconPath: {
      abbr: 'i',
      full: 'icon',
      help: 'Specify an icon to use on shortcuts and installer',
      required: true,
    },

    executable: {
      abbr: 'e',
      help: 'Specify file to create shortcuts for',
      required: true,
    },

    runAfterInstall: {
      abbr: 'r',
      flag: true,
      full: 'run-after',
      help: 'Run the application after installation completes',
    },

    localInstall: {
      flag: true,
      full: 'local',
      help: 'Install per user (no administrator rights required)',
      abbr: 'l',

    },
  }).parse();

packageMsi(opts, (err) => {
  if (err) {
    throw err;
  }
  // eslint-disable-next-line no-console
  console.log(`Outputed to ${path.resolve(opts.output)}`);
});
