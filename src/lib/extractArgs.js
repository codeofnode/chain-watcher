import { join } from 'path';
import { mkdirSync } from 'fs';

const getStringValue = (inp) => {
  if (inp === '1' || inp === 'true') return true;
  if (inp) return inp;
  return undefined;
};

const { version, name, description } = require('../package.json'); // eslint-disable-line import/no-unresolved

const showError = function showError(message) {
  console.log(`\n    ${name} - ${description} .\n`); // eslint-disable-line no-console
  console.log(`    version - ${version}\n`); // eslint-disable-line no-console
  if (typeof message === 'string') {
    console.error(message);  // eslint-disable-line no-console
  }
  process.exit(2);
};

const ALLOWED_LOG_LEVELS = ['prod', 'test', 'dev'];

const options = { };
let showHelp = false;

const argvs = process.argv.slice(2);
const arl = argvs.length;
for (let ind, arg, key, value, val, z = 0; z < arl; z += 1) {
  arg = argvs[z];
  ind = arg.indexOf('=');
  if (ind === -1) {
    continue; // eslint-disable-line no-continue
  }
  key = arg.substr(0, ind);
  value = getStringValue(arg.substr(ind + 1));
  val = ALLOWED_LOG_LEVELS.indexOf(value);
  switch (key.toLowerCase()) {
    case '-d':
    case '--datadir':
      if (typeof val === 'string') {
        options.datadir = val;
      } else {
        showHelp = 'Please provide correct value for data directory.';
      }
      break;
    case '-l':
    case '--loglevel':
      if (val !== -1) {
        options.loglevel = val;
      } else {
        showHelp = `Allowed values for \`${key}\` must be one of \`${String(ALLOWED_LOG_LEVELS)}\`.`;
      }
      break;
    case '-h':
    case '--help':
      showHelp = true;
      break;
    default :
      showHelp = `Invalid argument \`${key}\` was provided. Try again with valid arguments.`;
  }
}

if (!(showHelp)) {
  // set up defaults
}

if (showHelp) {
  showError(showHelp);
}

if (!(Object.prototype.hasOwnProperty.call(options, 'datadir'))) {
  options.datadir = 'addresses';
}
if (!(options.datadir.startsWith('/'))) {
  options.datadir = join(process.cwd(), options.datadir);
}
try {
  mkdirSync(options.datadir);
} catch (er) {
  if (er.code !== 'EEXIST') throw er;
}

if (!(Object.prototype.hasOwnProperty.call(options, 'loglevel'))) {
  const loglevel = ALLOWED_LOG_LEVELS.indexOf(process.env.NODE_ENV);
  if (loglevel !== -1) {
    options.loglevel = loglevel;
  }
}
if (!(Object.prototype.hasOwnProperty.call(options, 'loglevel'))) {
  options.loglevel = 0;
}

export default options;
