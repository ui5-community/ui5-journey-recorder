const glob = require("glob");
const fs = require('fs');
const byteSize = (size) => {
    const size_map = {
        0: 'B',
        1: 'kB',
        2: 'MB',
        3: 'GB'
    };
    let divided = 0;
    while (size > 1024) {
        divided++
        size = size / 1024.0;
    }
    return `${Math.floor(size * 100) / 100.0} ${size_map[divided]}`;
}

const getDirSize = async (sDirectoryName) => {
    const files = await glob.glob(`./${sDirectoryName}/**/*.*`);
    return files.map(f => {
        try {
            return fs.statSync(f).size
        } catch (_) {
            return 0;
        }
    }).reduce((a, b) => { return a + b; }, 0);
}
(async () => {
    const folderName = process.argv[2];
    const size = await getDirSize(folderName);
    console.log('Build size: ', byteSize(size));
})();