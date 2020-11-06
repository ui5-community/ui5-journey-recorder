module.exports = function (grunt) {
    "use strict";
    grunt.initConfig({
        zip: {
            'release.zip': [
                'scripts/**/*.*',
                'images/**/*.*',
                'ui5/**/*.*',
                'CHANGELOG.md',
                'README.md',
                'LICENSE',
                'manifest.json'
            ]
        }
    });

    grunt.loadNpmTasks('grunt-zip');
};