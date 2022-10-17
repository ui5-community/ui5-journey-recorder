const { zip } = require('zip-a-folder');
const { version } = require('./package.json');

const zipping = async () => {
  zip('dist', `../journey_recorder_${version.replace(/\./gm, '-')}.zip`);
}

zipping();
