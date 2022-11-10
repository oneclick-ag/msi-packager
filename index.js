import { execFile } from 'child_process';
import { promisify } from 'util';
import temp from 'temp';
import fs from 'fs/promises';
import generateXml from './generate-xml.js';

const tmpOpen = promisify(temp.open);
const generateXmlPromises = promisify(generateXml);

const writeXml = async (options) => {
  const { path } = await tmpOpen('msi-packager');

  const xml = await generateXmlPromises(options);

  await fs.writeFile(path, xml);

  return path;
};

export default async (options, cb) => {
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

  const xmlPath = await writeXml(options);

  const args = [xmlPath, '-o', options.output];

  if (options.enableUi) {
    args.push('--ext', 'ui');
  }

  if (options.arch) {
    args.push('--arch', options.arch);
  }

  execFile('wixl', args, cb);
};
