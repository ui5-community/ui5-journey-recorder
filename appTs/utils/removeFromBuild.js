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

const getDirSize = async (folderGlob) => {
    const files = await glob.glob(folderGlob);
    return files.map(f => {
        try {
            return fs.statSync(f).size
        } catch (_) {
            return 0;
        }
    }).reduce((a, b) => { return a + b; }, 0);
}

const removeFolders = async (aFoldersToRemove) => {
    aFoldersToRemove.forEach(f => {
        if (fs.existsSync(f)) {
            fs.rmSync(f, { recursive: true });
        }
    });
}

const removeFiles = async (aFilesToRemoveGlobs) => {
    aFilesToRemoveGlobs.forEach(async (g) => {
        const files = await glob.glob(g)
        files.forEach(f => {
            if (fs.existsSync(f)) {
                fs.unlinkSync(f)
            }
        })
    });
}

const removeMessageBundles = async (aMessageBundlePatterns, langs) => {
    // by specifying '_' as part of the name we automatically ignore the default message bundles
    aMessageBundlePatterns.forEach(async (g) => {
        const bundles = await glob.glob(g);
        bundles.forEach(f => {
            // if this messagebundle contains the languages for only one of the allowed, keep it.
            const usedBundle = langs.map(lang => f.indexOf(lang) !== -1).reduce((a, b) => a || b, false);
            if (!usedBundle && fs.existsSync(f)) {
                fs.unlinkSync(f);
            }
        })
    });
}


const allowedLanguages = ['de', 'en'];
const distFolder = './dist/**/*.*';
const filesToRemove = ['dist/**/*-dbg.js',
    'dist/**/*-dbg.*.js',
    'dist/**/*.js.map',
    'dist/**/*.type.js',
    'dist/**/*.ts',
    'dist/**/*.gitkeep',
    'dist/**/*.less',
];
const messageBundlesGlob = ['dist/**/messagebundle_*.properties'];
const unnecessaryFolders = ['dist/test/', 'dist/test-resources/'];

(async () => {
    const sizeBefore = await getDirSize(distFolder);
    console.log('Removing unnecessary files');
    await removeFiles(filesToRemove);
    console.log('Removing test related folders');
    await removeFolders(unnecessaryFolders);
    console.log('Removing unnecessary message bundles');
    await removeMessageBundles(messageBundlesGlob, allowedLanguages);
    const sizeAfter = await getDirSize(distFolder);
    console.log('Size "dist" before: ', byte_size(sizeBefore));
    console.log('Size "dist" after: ', byte_size(sizeAfter));
})()