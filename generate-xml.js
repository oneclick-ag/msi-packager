const fs = require('fs/promises');
const { join } = require('path');
const each = require('async-each');
const el = require('./lib/hyperxml.js');

const getProgramsFolder = (options) => {
  if (options.localInstall) {
    return 'LocalAppDataFolder';
  }
  if (options.arch === 'x64') {
    return 'ProgramFiles64Folder';
  }

  return 'ProgramFilesFolder';
};

const installerFor = (components, options) => el('Wix', {
  xmlns: 'http://schemas.microsoft.com/wix/2006/wi',
}, [

  el('Product', {
    Id: '*',
    Name: options.name,
    UpgradeCode: options.upgradeCode,
    Language: '1033',
    Codepage: '1252',
    Version: options.version,
    Manufacturer: options.manufacturer,
  }, [

    el('Property', {
      Id: 'PREVIOUSVERSIONSINSTALLED',
      Secure: 'yes',
    }),

    el('Upgrade', {
      Id: options.upgradeCode,
    }, [
      el('UpgradeVersion', {
        Minimum: '0.0.0',
        Property: 'PREVIOUSVERSIONSINSTALLED',
        IncludeMinimum: 'yes',
        IncludeMaximum: 'no',
      }),
    ]),

    // options.runAfterInstall ? el('Property', {
    //   Id: 'cmd',
    //   Value: 'cmd.exe',
    // }) : '',
    //
    // options.runAfterInstall ? el('CustomAction', {
    //   Id: 'LaunchApplication',
    //   ExeCommand: `/c start "" "%programfiles%\\${options.name}\\${options.executable}"`,
    //   Execute: '',
    //   Property: 'cmd',
    //   Impersonate: 'yes',
    // }) : '',
    //
    el('InstallExecuteSequence', [
      el('RemoveExistingProducts', {
        Before: 'InstallInitialize',
      }),
      options.runAfterInstall ? el('Custom', {
        Action: 'EXECUTE_AFTER_INSTALL',
        After: 'InstallFinalize',
      }, ['NOT Installed']) : '',
      options.runBeforeUninstall ? el('Custom', {
        Action: 'EXECUTE_BEFORE_UNINSTALL',
        Before: 'InstallInitialize',
      }, ['(NOT UPGRADINGPRODUCTCODE) AND (REMOVE~="ALL")']) : '',
    ]),

    options.runAfterInstall ? el('CustomAction', {
      Id: 'EXECUTE_AFTER_INSTALL',
      FileKey: options.runAfterInstall,
      ExeCommand: '',
      Execute: 'immediate',
      Impersonate: 'yes',
      Return: 'ignore',
    }) : '',

    options.runBeforeUninstall ? el('CustomAction', {
      Id: 'EXECUTE_BEFORE_UNINSTALL',
      FileKey: options.runBeforeUninstall,
      ExeCommand: '',
      Execute: 'immediate',
      Impersonate: 'yes',
      Return: 'ignore',
    }) : '',

    el('Package', {
      InstallerVersion: '200',
      Compressed: 'yes',
      Comments: 'Windows Installer Package',
      InstallScope: options.localInstall ? 'perUser' : 'perMachine',
    }),

    el('Media', {
      Id: '1',
      Cabinet: 'app.cab',
      EmbedCab: 'yes',
    }),

    options.enableUi ? el('UIRef', {
      Id: 'WixUI_Minimal',
    }) : '',

    el('Icon', {
      Id: 'icon.ico',
      SourceFile: options.iconPath,
    }),

    el('Property', {
      Id: 'ARPPRODUCTICON',
      Value: 'icon.ico',
    }),

    el('Directory', {
      Id: 'TARGETDIR',
      Name: 'SourceDir',
    }, [
      el('Directory', {
        Id: getProgramsFolder(options),
      }, [
        el('Directory', {
          Id: 'INSTALLDIR',
          Name: options.name,
        }, components),
      ]),
    ]),

    el('Feature', {
      Id: 'App',
      Level: '1',
    }, options.componentIds.map((id) => el('ComponentRef', { Id: id }))),

  ]),
]);

const getComponents = async (path, options, cb) => {
  const fullPath = join(options.source, path);
  const ids = [];

  const entries = await fs.readdir(fullPath);
  const filteredEntries = entries.filter((entry) => entry !== '.DS_Store');

  each(filteredEntries, async (entry, next) => {
    const subPath = join(path, entry);

    const stats = await fs.stat(join(fullPath, entry));

    if (stats.isDirectory()) {
      await getComponents(subPath, options, (err, components, subIds) => {
        if (err) {
          return next(err);
        }

        ids.push(...subIds);

        return next(null, el('Directory', {
          Id: encodeURIComponent(subPath),
          Name: entry,
        }, components));
      });
    } else {
      const id = encodeURIComponent(subPath);
      ids.push(id);

      const newEntry = entry.replace(/\$/g, '$$$$');
      const items = [
        el('File', {
          Id: id,
          Source: join(fullPath, newEntry),
          Name: newEntry,
        }),
      ];

      if (subPath === options.executable) {
        items.push(el('Shortcut', {
          Id: 'StartMenuShortcut',
          Advertise: 'yes',
          Icon: 'icon.ico',
          Name: options.name,
          Directory: 'ProgramMenuFolder',
          WorkingDirectory: 'INSTALLDIR',
          Description: options.description || '',
        }), el('Shortcut', {
          Id: 'DesktopShortcut',
          Advertise: 'yes',
          Icon: 'icon.ico',
          Name: options.name,
          Directory: 'DesktopFolder',
          WorkingDirectory: 'INSTALLDIR',
          Description: options.description || '',
        }));
      }

      next(null, el('Component', {
        Id: id,
        Guid: '*',
      }, items));
    }
  }, (err, components) => {
    if (err) {
      return cb(err);
    }

    return cb(null, components, ids);
  });
};

module.exports = async (options, cb) => {
  await getComponents('.', options, (err, components, ids) => {
    if (err) {
      return cb(err);
    }

    const optionsWithIds = Object.create(options);
    optionsWithIds.componentIds = ids;

    return cb(null, installerFor(components, optionsWithIds).toXml({ pretty: true }));
  });
};
