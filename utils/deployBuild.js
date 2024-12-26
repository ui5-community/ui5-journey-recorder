"use strict";
const fs = require("fs");
const glob = require("glob");
const path = require("path");
const { zip } = require('zip-a-folder');
const { version } = require('../package.json');
const { argv } = require('process');

const WORK_DIR = process.cwd();

const CONFIG = {
    DEPLOY_BUILD: "deploySelection",
    PROJECT_FOLDER: "webapp",
    BUILD_FOLDER: "dist",
    DEPLOY_VERSIONS: "deployments",
    UNUSEDFILE_ENDINGS: [
        '/**/*-dbg.js',
        '/**/*-dbg.*.js',
        '/**/*.js.map',
        '/**/*.type.js',
        '/**/*.ts',
        '/**/*.gitkeep',
        '/**/*.less',
    ],
    RECURSIVE_FOLDERS: [
        'assets',
        'css',
        'resources/sap/ui/core/themes',
        'resources/sap/ui/layout/themes',
        'resources/sap/m/themes',
        'resources/sap/f/themes',
        'resources/sap/uxap/themes',
        'resources/sap/ui/unified/themes'
    ],
    FILES_TO_COPY: [
        "index.html",
        "favicon.ico",
        "manifest.json",
        "resources/sap-ui-custom.js",
        "resources/sap/m/CheckBox.js",
        "resources/sap/m/CheckBoxRenderer.js",
        "resources/sap/m/VBox.js",
        "resources/sap/m/VBoxRenderer.js",
        "resources/sap/ui/core/messagebundle.properties",
        "resources/sap/ui/core/messagebundle_de.properties",
        "resources/sap/ui/core/messagebundle_en_GB.properties",
        "resources/sap/ui/core/messagebundle_en_US_sappsd.properties",
        "resources/sap/ui/core/messagebundle_en_US_saprigi.properties",
        "resources/sap/ui/core/messagebundle_en_US_saptrc.properties",
        "resources/sap/ui/core/messagebundle_en.properties",
        "resources/sap/ui/core/ComponentSupport.js",
        "resources/sap/ui/core/date/Gregorian.js",
        "resources/sap/ui/core/cldr/en.json",
        "resources/sap/ui/core/boot/FieldHelpEndpoint.js",
        "resources/sap/ui/layout/library-preload-lazy.js",
        "resources/sap/ui/unified/library-preload-lazy.js",
        "resources/sap/m/messagebundle.properties",
        "resources/sap/m/messagebundle_de.properties",
        "resources/sap/m/messagebundle_en_GB.properties",
        "resources/sap/m/messagebundle_en_US_sappsd.properties",
        "resources/sap/m/messagebundle_en_US_saprigi.properties",
        "resources/sap/m/messagebundle_en.properties",
        "resources/sap/f/messagebundle.properties",
        "resources/sap/f/messagebundle_de.properties",
        "resources/sap/f/messagebundle_en_GB.properties",
        "resources/sap/f/messagebundle_en_US_sappsd.properties",
        "resources/sap/f/messagebundle_en_US_saprigi.properties",
        "resources/sap/f/messagebundle_en.properties",
        "resources/sap/uxap/messagebundle.properties",
        "resources/sap/uxap/messagebundle_de.properties",
        "resources/sap/uxap/messagebundle_en_GB.properties",
        "resources/sap/uxap/messagebundle_en_US_sappsd.properties",
        "resources/sap/uxap/messagebundle_en_US_saprigi.properties",
        "resources/sap/uxap/messagebundle_en_US_saptrc.properties",
        "resources/sap/uxap/messagebundle_en.properties",
        "resources/sap/ui/layout/messagebundle.properties",
        "resources/sap/ui/layout/messagebundle_de.properties",
        "resources/sap/ui/layout/messagebundle_en_GB.properties",
        "resources/sap/ui/layout/messagebundle_en_US_saprigi.properties",
        "resources/sap/ui/layout/messagebundle_en_US_saptrc.properties",
        "resources/sap/ui/layout/messagebundle_en.properties",
    ]
}

function cleanup() {
    console.log("Remove old deploy build");
    fs.rmSync(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD), { recursive: true, force: true });
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
    return _removeFiles(CONFIG.UNUSEDFILE_ENDINGS.map(ending => path.join(WORK_DIR, CONFIG.BUILD_FOLDER, ending)));
}

async function buildFolderStructure() {
    console.log("Recreate deploy build");
    // create necessary subfolders
    console.log("Create folderstructure");
    await fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD));
    await fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, '/resources'));
    await fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, '/resources/sap'));
    await fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, '/resources/sap/ui'));
    await Promise.all([
        fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, "/resources/sap/m")),
        fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, "/resources/sap/uxap")),
        fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, "/resources/sap/f"))
    ]);
    await Promise.all([
        fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, "/resources/sap/ui/core")).then(() => {
            return Promise.all([
                fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, "/resources/sap/ui/core/date")),
                fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, "/resources/sap/ui/core/cldr")),
                fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, "/resources/sap/ui/core/boot"))
            ])
        }),
        fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, "/resources/sap/ui/layout")),
        fs.promises.mkdir(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, "/resources/sap/ui/unified"))
    ]);
}

function recursiveFolderCopy() {
    //recursive copy necessary folder
    console.log("Copy folders");
    return Promise.all(CONFIG.RECURSIVE_FOLDERS.map(rc => fs.promises.cp(path.join(WORK_DIR, CONFIG.BUILD_FOLDER, rc), path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, rc), { recursive: true })));
}

function selectiveFileCopy() {
    //copy single files
    console.log("copy files");
    return Promise.all(CONFIG.FILES_TO_COPY.map(rc => fs.promises.cp(path.join(WORK_DIR, CONFIG.BUILD_FOLDER, rc), path.join(WORK_DIR, CONFIG.DEPLOY_BUILD, rc))));
}

function createDeployZip(bPreVersion) {
    console.log("Creating deploy ZIP");
    let suffix = '';
    if (bPreVersion) {
        suffix = 'nightly_'
    }
    if (!fs.existsSync(path.join(WORK_DIR, CONFIG.DEPLOY_VERSIONS))) {
        fs.mkdirSync(path.join(WORK_DIR, CONFIG.DEPLOY_VERSIONS));
    }
    return zip(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD), path.join(WORK_DIR, CONFIG.DEPLOY_VERSIONS, `journey_recorder_${suffix}${version.replace(/\./gm, '-')}.zip`));
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
    return `${Math.floor(iSize * 100) / 100.0} ${size_map[divided]}`;
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
    await buildExtension(path.join(WORK_DIR, CONFIG.PROJECT_FOLDER), path.join(WORK_DIR, CONFIG.BUILD_FOLDER));
    if (argv.includes('--size')) {
        console.log('Build-Size, ui5 tooling: ', (await getDirSize(path.join(WORK_DIR, CONFIG.BUILD_FOLDER))));
    }
    await cleanupTheBuildStuff();

    if (argv.includes('--size')) {
        console.log('Build-Size, cleanup: ', (await getDirSize(path.join(WORK_DIR, CONFIG.BUILD_FOLDER))));
    }
    await buildFolderStructure();
    await recursiveFolderCopy();
    await selectiveFileCopy();

    if (argv.includes('--size')) {
        console.log('Build-Size, deploy: ', (await getDirSize(path.join(WORK_DIR, CONFIG.DEPLOY_BUILD))));
    }
    await createDeployZip(argv.includes('--pre'));

    if (!(argv.includes('--keep'))) {
        cleanup();
    }
})();
