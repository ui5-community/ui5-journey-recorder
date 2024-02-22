const glob = require("glob");
const fs = require("fs");

const byte_size = (size) => {
    const size_map = {
        0: 'B',
        1: 'kB',
        2: 'mB',
        3: 'gB'
    };
    let divided = 0;
    while (size > 1024) {
        divided++
        size = size / 1024.0;
    }
    return `${Math.floor(size * 100) / 100.0} ${size_map[divided]}`;
}

const getDistSize = async () => {
    const files = await glob.glob('./dist/**/*.*');
    return files.map(f => {
        try {
            return fs.statSync(f).size
        } catch (_) {
            return 0;
        }
    }).reduce((a, b) => { return a + b; }, 0);
}

const removeFiles = async () => {
    ['dist/**/*-dbg.js',
        'dist/**/*.js.map',
        'dist/**/*.ts',].forEach(async (g) => {
            const files = await glob.glob(g)
            files.forEach(f => {
                if (fs.existsSync(f)) {
                    fs.unlinkSync(f)
                }
            })
        });
}

const removeFolders = async () => {
    ['dist/test/', 'dist/test-resources/'].forEach(f => {
        if (fs.existsSync(f)) {
            fs.rmSync(f, { recursive: true });
        }
    })
}

(async () => {
    const sizeBefore = await getDistSize();
    await removeFiles();
    await removeFolders();
    const sizeAfter = await getDistSize();
    console.log('Size "dist" before: ', byte_size(sizeBefore));
    console.log('Size "dist" after: ', byte_size(sizeAfter));
})()