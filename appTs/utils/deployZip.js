const { zip } = require('zip-a-folder');
const { version } = require('./package.json');
const { argv } = require('process');

let suffix = '';
if (argv.includes('--pre')) {
  suffix = 'nightly_'
}

const zipping = async () => {
  zip('../deploySelection', `../journey_recorder_${suffix}${version.replace(/\./gm, '-')}.zip`);
}

zipping();
