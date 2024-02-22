const glob = require("glob");
const fs = require("fs");

const { readdir, stat } = require('fs/promises');
const { join } = require('path');
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
const dirSize = async dir => {
    const files = await readdir(dir, { withFileTypes: true });

    const paths = files.map(async file => {
        const path = join(dir, file.name);

        if (file.isDirectory()) return await dirSize(path);

        if (file.isFile()) {
            const { size } = await stat(path);

            return size;
        }

        return 0;
    });

    return (await Promise.all(paths)).flat(Infinity).reduce((i, size) => i + size, 0);
}

const getDistSize = async () => {
    const files = await glob.glob('./dist/**/*.*');
    console.log(files.length);
    return files.map(f => {
        try {
            return fs.statSync(f).size
        } catch (_) {
            return 0;
        }
    }).reduce((a, b) => { console.log(a + b); return a + b; }, 0);
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