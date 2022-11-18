const { promisify } = require('util');
const execFile = promisify(require('child_process').execFile);
const temp = require('temp');
const fs = require('fs/promises');
const generateXml = require('./generate-xml.js');

const tmpOpen = promisify(temp.track().open);
const generateXmlPromises = promisify(generateXml);

const writeXml = async (options) => {
  const { path } = await tmpOpen('msi-packager');

  const xml = await generateXmlPromises(options);

  await fs.writeFile(path, xml);

  return path;
};

module.exports = async (options, cb) => {
  // options:
  //  source
  //  output
  //  name
  //  upgradeCode
  //  version
  //  manufacturer
  //  arch
  //  iconPath
  //  executable
  //  localInstall
  //  enableUi (License.rtf must be in the root folder for extensions - ext)
  //  runAfterInstall

  const xmlPath = await writeXml(options);

  const args = [xmlPath, '-o', options.output];

  if (options.enableUi) {
    args.push('--ext', 'ui');
  }

  if (options.arch) {
    args.push('--arch', options.arch);
  }

  return execFile('wixl', args, cb);
};
