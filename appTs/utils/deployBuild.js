"use strict";
const fs = require("fs");
const { spawn } = require("child_process");
const glob = require("glob");
const { zip } = require('zip-a-folder');
const { version } = require('../package.json');
const { argv } = require('process');
const DEPLOY_FOLDER = "deploySelection";
const PROJECT_FOLDER = "webapp";
const BUILD_FOLDER = "dist";
const DEPLOY_VERSIONS = "deployments";
const UNUSEDFILE_ENDINGS = [
    '/**/*-dbg.js',
    '/**/*-dbg.*.js',
    '/**/*.js.map',
    '/**/*.type.js',
    '/**/*.ts',
    '/**/*.gitkeep',
    '/**/*.less',
];

function cleanup() {
    // first remove old stuff
    console.log("Remove old deploy selection");
    fs.rmSync(DEPLOY_FOLDER, { recursive: true, force: true });
}

async function buildExtension(projectPath, destinationPath) {
    const { graphFromPackageDependencies } = await import("@ui5/project/graph");
    const graph = await graphFromPackageDependencies({ cwd: projectPath });
    return graph.build({
        destPath: destinationPath,
        selfContained: true,
        includedDependencies: ["*"],
        cleanDest: true
    });
}

async function _removeFiles(aFilesToRemoveGlobs) {
    const files = (await Promise.all(aFilesToRemoveGlobs.map(tg => glob.glob(tg)))).flat();
    return Promise.all(files.map(async (f) => {
        if (fs.existsSync(f)) {
            fs.unlinkSync(f)
        }
    }));
}

function cleanupTheBuildStuff() {
    console.log('Removing unnecessary files for recursive copy');
    return _removeFiles(UNUSEDFILE_ENDINGS.map(ending => `${BUILD_FOLDER}${ending}`));
}
//remove unnecessary stuff

async function buildFolderStructure() {
    console.log("Recreate deploy build");
    // create necessary subfolders
    console.log("Create folderstructure");
    await fs.promises.mkdir(DEPLOY_FOLDER);
    await fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources`);
    await fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap`);
    await fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap/ui`);
    await Promise.all([
        fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap/m`),
        fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap/uxap`),
        fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap/f`)
    ]);
    await Promise.all([
        fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap/ui/core`).then(() => {
            return Promise.all([
                fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap/ui/core/date`),
                fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap/ui/core/cldr`)
            ])
        }),
        fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap/ui/layout`),
        fs.promises.mkdir(`./${DEPLOY_FOLDER}/resources/sap/ui/unified`)
    ]);
}
// copy/create only the necessary stuff

function recursiveFolderCopy() {
    //recursive copy necessary folder
    console.log("copy folders");
    return Promise.all([
        fs.promises.cp("./dist/assets", `./${DEPLOY_FOLDER}/assets`, { recursive: true }),
        fs.promises.cp("./dist/css", `./${DEPLOY_FOLDER}/css`, { recursive: true }),
        fs.promises.cp("./dist/resources/sap/ui/core/themes", `./${DEPLOY_FOLDER}/resources/sap/ui/core/themes`, { recursive: true }),
        fs.promises.cp("./dist/resources/sap/ui/layout/themes", `./${DEPLOY_FOLDER}/resources/sap/ui/layout/themes`, { recursive: true }),
        fs.promises.cp("./dist/resources/sap/m/themes", `./${DEPLOY_FOLDER}/resources/sap/m/themes`, { recursive: true }),
        fs.promises.cp("./dist/resources/sap/f/themes", `./${DEPLOY_FOLDER}/resources/sap/f/themes`, { recursive: true }),
        fs.promises.cp("./dist/resources/sap/uxap/themes", `./${DEPLOY_FOLDER}/resources/sap/uxap/themes`, { recursive: true }),
        fs.promises.cp("./dist/resources/sap/ui/unified/themes/", `./${DEPLOY_FOLDER}/resources/sap/ui/unified/themes/`, { recursive: true })
    ]);
}

function selectiveFileCopy() {
    //copy single files
    console.log("copy files");
    return Promise.all([
        fs.promises.cp("./dist/index.html", `./${DEPLOY_FOLDER}/index.html`),
        fs.promises.cp("./dist/favicon.ico", `./${DEPLOY_FOLDER}/favicon.ico`),
        fs.promises.cp("./dist/manifest.json", `./${DEPLOY_FOLDER}/manifest.json`),
        fs.promises.cp("./dist/resources/sap-ui-custom.js", `./${DEPLOY_FOLDER}/resources/sap-ui-custom.js`),
        fs.promises.cp("./dist/resources/sap/m/Checkbox.js", `./${DEPLOY_FOLDER}/resources/sap/m/Checkbox.js`),
        fs.promises.cp("./dist/resources/sap/m/Vbox.js", `./${DEPLOY_FOLDER}/resources/sap/m/Vbox.js`),
        fs.promises.cp("./dist/resources/sap/ui/core/messagebundle.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/core/messagebundle.properties`),
        fs.promises.cp("./dist/resources/sap/ui/core/messagebundle_de.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/core/messagebundle_de.properties`),
        fs.promises.cp("./dist/resources/sap/ui/core/messagebundle_en_GB.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/core/messagebundle_en_GB.properties`),
        fs.promises.cp("./dist/resources/sap/ui/core/messagebundle_en_US_sappsd.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/core/messagebundle_en_US_sappsd.properties`),
        fs.promises.cp("./dist/resources/sap/ui/core/messagebundle_en_US_saprigi.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/core/messagebundle_en_US_saprigi.properties`),
        fs.promises.cp("./dist/resources/sap/ui/core/messagebundle_en_US_saptrc.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/core/messagebundle_en_US_saptrc.properties`),
        fs.promises.cp("./dist/resources/sap/ui/core/messagebundle_en.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/core/messagebundle_en.properties`),
        fs.promises.cp("./dist/resources/sap/ui/core/ComponentSupport.js", `./${DEPLOY_FOLDER}/resources/sap/ui/core/ComponentSupport.js`),
        fs.promises.cp("./dist/resources/sap/ui/core/date/Gregorian.js", `./${DEPLOY_FOLDER}/resources/sap/ui/core/date/Gregorian.js`),
        fs.promises.cp("./dist/resources/sap/ui/core/cldr/en.json", `./${DEPLOY_FOLDER}/resources/sap/ui/core/cldr/en.json`),
        fs.promises.cp("./dist/resources/sap/ui/layout/library-preload-lazy.js", `./${DEPLOY_FOLDER}/resources/sap/ui/layout/library-preload-lazy.js`),
        fs.promises.cp("./dist/resources/sap/ui/unified/library-preload-lazy.js", `./${DEPLOY_FOLDER}/resources/sap/ui/unified/library-preload-lazy.js`),
        fs.promises.cp("./dist/resources/sap/m/messagebundle.properties", `./${DEPLOY_FOLDER}/resources/sap/m/messagebundle.properties`),
        fs.promises.cp("./dist/resources/sap/m/messagebundle_de.properties", `./${DEPLOY_FOLDER}/resources/sap/m/messagebundle_de.properties`),
        fs.promises.cp("./dist/resources/sap/m/messagebundle_en_GB.properties", `./${DEPLOY_FOLDER}/resources/sap/m/messagebundle_en_GB.properties`),
        fs.promises.cp("./dist/resources/sap/m/messagebundle_en_US_sappsd.properties", `./${DEPLOY_FOLDER}/resources/sap/m/messagebundle_en_US_sappsd.properties`),
        fs.promises.cp("./dist/resources/sap/m/messagebundle_en_US_saprigi.properties", `./${DEPLOY_FOLDER}/resources/sap/m/messagebundle_en_US_saprigi.properties`),
        fs.promises.cp("./dist/resources/sap/m/messagebundle_en_US_saptrc.properties", `./${DEPLOY_FOLDER}/resources/sap/m/messagebundle_en_US_saptrc.properties`),
        fs.promises.cp("./dist/resources/sap/m/messagebundle_en.properties", `./${DEPLOY_FOLDER}/resources/sap/m/messagebundle_en.properties`),
        fs.promises.cp("./dist/resources/sap/f/messagebundle.properties", `./${DEPLOY_FOLDER}/resources/sap/f/messagebundle.properties`),
        fs.promises.cp("./dist/resources/sap/f/messagebundle_de.properties", `./${DEPLOY_FOLDER}/resources/sap/f/messagebundle_de.properties`),
        fs.promises.cp("./dist/resources/sap/f/messagebundle_en_GB.properties", `./${DEPLOY_FOLDER}/resources/sap/f/messagebundle_en_GB.properties`),
        fs.promises.cp("./dist/resources/sap/f/messagebundle_en_US_sappsd.properties", `./${DEPLOY_FOLDER}/resources/sap/f/messagebundle_en_US_sappsd.properties`),
        fs.promises.cp("./dist/resources/sap/f/messagebundle_en_US_saprigi.properties", `./${DEPLOY_FOLDER}/resources/sap/f/messagebundle_en_US_saprigi.properties`),
        fs.promises.cp("./dist/resources/sap/f/messagebundle_en_US_saptrc.properties", `./${DEPLOY_FOLDER}/resources/sap/f/messagebundle_en_US_saptrc.properties`),
        fs.promises.cp("./dist/resources/sap/f/messagebundle_en.properties", `./${DEPLOY_FOLDER}/resources/sap/f/messagebundle_en.properties`),
        fs.promises.cp("./dist/resources/sap/uxap/messagebundle.properties", `./${DEPLOY_FOLDER}/resources/sap/uxap/messagebundle.properties`),
        fs.promises.cp("./dist/resources/sap/uxap/messagebundle_de.properties", `./${DEPLOY_FOLDER}/resources/sap/uxap/messagebundle_de.properties`),
        fs.promises.cp("./dist/resources/sap/uxap/messagebundle_en_GB.properties", `./${DEPLOY_FOLDER}/resources/sap/uxap/messagebundle_en_GB.properties`),
        fs.promises.cp("./dist/resources/sap/uxap/messagebundle_en_US_sappsd.properties", `./${DEPLOY_FOLDER}/resources/sap/uxap/messagebundle_en_US_sappsd.properties`),
        fs.promises.cp("./dist/resources/sap/uxap/messagebundle_en_US_saprigi.properties", `./${DEPLOY_FOLDER}/resources/sap/uxap/messagebundle_en_US_saprigi.properties`),
        fs.promises.cp("./dist/resources/sap/uxap/messagebundle_en_US_saptrc.properties", `./${DEPLOY_FOLDER}/resources/sap/uxap/messagebundle_en_US_saptrc.properties`),
        fs.promises.cp("./dist/resources/sap/uxap/messagebundle_en.properties", `./${DEPLOY_FOLDER}/resources/sap/uxap/messagebundle_en.properties`),
        fs.promises.cp("./dist/resources/sap/ui/layout/messagebundle.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/layout/messagebundle.properties`),
        fs.promises.cp("./dist/resources/sap/ui/layout/messagebundle_de.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/layout/messagebundle_de.properties`),
        fs.promises.cp("./dist/resources/sap/ui/layout/messagebundle_en_GB.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/layout/messagebundle_en_GB.properties`),
        fs.promises.cp("./dist/resources/sap/ui/layout/messagebundle_en_US_sappsd.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/layout/messagebundle_en_US_sappsd.properties`),
        fs.promises.cp("./dist/resources/sap/ui/layout/messagebundle_en_US_saprigi.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/layout/messagebundle_en_US_saprigi.properties`),
        fs.promises.cp("./dist/resources/sap/ui/layout/messagebundle_en_US_saptrc.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/layout/messagebundle_en_US_saptrc.properties`),
        fs.promises.cp("./dist/resources/sap/ui/layout/messagebundle_en.properties", `./${DEPLOY_FOLDER}/resources/sap/ui/layout/messagebundle_en.properties`),

    ]);
}

function createDeployZip(bPreVersion) {
    console.log("Creating deploy ZIP");
    let suffix = '';
    if (bPreVersion) {
        suffix = 'nightly_'
    }
    if (!fs.existsSync(DEPLOY_VERSIONS)) {
        fs.mkdirSync(`${DEPLOY_VERSIONS}`);
    }
    return zip(`${DEPLOY_FOLDER}`, `${DEPLOY_VERSIONS}/journey_recorder_${suffix}${version.replace(/\./gm, '-')}.zip`);
}

function _byteSize(iSize) {
    const size_map = {
        0: 'B',
        1: 'kB',
        2: 'MB',
        3: 'GB'
    };
    let divided = 0;
    while (iSize > 1024) {
        divided++
        iSize = iSize / 1024.0;
    }
    return `${Math.floor(size * 100) / 100.0} ${size_map[divided]}`;
}

async function getDirSize(sDirName) {
    const files = await glob.glob(`./${sDirName}/**/*.*`);
    return _byteSize(files.map(f => {
        try {
            return fs.statSync(f).size;
        } catch (_) {
            return 0;
        }
    }).reduce((a, b) => { return a + b; }, 0));
}

(async () => {
    cleanup();
    await buildExtension(PROJECT_FOLDER, BUILD_FOLDER);
    if (argv.includes('--measure')) {
        await getDirSize(BUILD_FOLDER);
    }
    await cleanupTheBuildStuff();

    if (argv.includes('--measure')) {
        await getDirSize(BUILD_FOLDER);
    }
    await buildFolderStructure();
    await recursiveFolderCopy();
    await selectiveFileCopy();

    if (argv.includes('--measure')) {
        await getDirSize(DEPLOY_FOLDER);
    }
    await createDeployZip(argv.includes('--pre'));

    if (!(argv.includes('--keep'))) {
        cleanup();
    }
})();
