#!/bin/bash

# first remove old stuff
echo Removing old
rm -rf deploySelection
# recreate to have a new testrun
echo start all over
mkdir deploySelection

#we assume that everything is already installed because of developement
npm run build

node ./utils/removeFromBuild.js
node ./utils/buildSize.js dist

echo recreate build
#copy/create only the necessary stuff
#create necessary subfolders
echo create subfolders
mkdir ./deploySelection/resources

mkdir ./deploySelection/resources/sap

mkdir ./deploySelection/resources/sap/ui
mkdir ./deploySelection/resources/sap/ui/core
mkdir ./deploySelection/resources/sap/ui/core/date
mkdir ./deploySelection/resources/sap/ui/core/cldr
mkdir ./deploySelection/resources/sap/ui/layout
mkdir ./deploySelection/resources/sap/ui/unified

mkdir ./deploySelection/resources/sap/m
mkdir ./deploySelection/resources/sap/uxap
mkdir ./deploySelection/resources/sap/f

#recursive copy necessary folder
echo copy folders
cp -r ./dist/assets ./deploySelection/assets
cp -r ./dist/css ./deploySelection/css
cp -r ./dist/resources/sap/ui/core/themes ./deploySelection/resources/sap/ui/core/themes
cp -r ./dist/resources/sap/ui/layout/themes ./deploySelection/resources/sap/ui/layout/themes
cp -r ./dist/resources/sap/m/themes ./deploySelection/resources/sap/m/themes
cp -r ./dist/resources/sap/f/themes ./deploySelection/resources/sap/f/themes
cp -r ./dist/resources/sap/uxap/themes ./deploySelection/resources/sap/uxap/themes
cp -r ./dist/resources/sap/ui/unified/themes/ ./deploySelection/resources/sap/ui/unified/themes/

rm ./deploySelection/assets/.gitkeep

#copy single files
echo copy files
cp "./dist/index.html" "./deploySelection/index.html"
cp "./dist/favicon.ico" "./deploySelection/favicon.ico"
cp "./dist/manifest.json" "./deploySelection/manifest.json"

cp "./dist/resources/sap-ui-custom.js" "./deploySelection/resources/sap-ui-custom.js"

cp "./dist/resources/sap/m/Checkbox.js" "./deploySelection/resources/sap/m/Checkbox.js"
cp "./dist/resources/sap/m/Vbox.js" "./deploySelection/resources/sap/m/Vbox.js"

cp "./dist/resources/sap/ui/core/messagebundle.properties" "./deploySelection/resources/sap/ui/core/messagebundle.properties"
cp "./dist/resources/sap/ui/core/messagebundle_de.properties" "./deploySelection/resources/sap/ui/core/messagebundle_de.properties"
cp "./dist/resources/sap/ui/core/messagebundle_en_GB.properties" "./deploySelection/resources/sap/ui/core/messagebundle_en_GB.properties"
cp "./dist/resources/sap/ui/core/messagebundle_en_US_sappsd.properties" "./deploySelection/resources/sap/ui/core/messagebundle_en_US_sappsd.properties"
cp "./dist/resources/sap/ui/core/messagebundle_en_US_saprigi.properties" "./deploySelection/resources/sap/ui/core/messagebundle_en_US_saprigi.properties"
cp "./dist/resources/sap/ui/core/messagebundle_en_US_saptrc.properties" "./deploySelection/resources/sap/ui/core/messagebundle_en_US_saptrc.properties"
cp "./dist/resources/sap/ui/core/messagebundle_en.properties" "./deploySelection/resources/sap/ui/core/messagebundle_en.properties"
cp "./dist/resources/sap/ui/core/ComponentSupport.js" "./deploySelection/resources/sap/ui/core/ComponentSupport.js"

cp "./dist/resources/sap/ui/core/date/Gregorian.js" "./deploySelection/resources/sap/ui/core/date/Gregorian.js"
cp "./dist/resources/sap/ui/core/cldr/en.json" "./deploySelection/resources/sap/ui/core/cldr/en.json"

cp "./dist/resources/sap/ui/layout/library-preload-lazy.js" "./deploySelection/resources/sap/ui/layout/library-preload-lazy.js"

cp "./dist/resources/sap/ui/unified/library-preload-lazy.js" "./deploySelection/resources/sap/ui/unified/library-preload-lazy.js"

cp "./dist/resources/sap/m/messagebundle.properties" "./deploySelection/resources/sap/m/messagebundle.properties"
cp "./dist/resources/sap/m/messagebundle_de.properties" "./deploySelection/resources/sap/m/messagebundle_de.properties"
cp "./dist/resources/sap/m/messagebundle_en_GB.properties" "./deploySelection/resources/sap/m/messagebundle_en_GB.properties"
cp "./dist/resources/sap/m/messagebundle_en_US_sappsd.properties" "./deploySelection/resources/sap/m/messagebundle_en_US_sappsd.properties"
cp "./dist/resources/sap/m/messagebundle_en_US_saprigi.properties" "./deploySelection/resources/sap/m/messagebundle_en_US_saprigi.properties"
cp "./dist/resources/sap/m/messagebundle_en_US_saptrc.properties" "./deploySelection/resources/sap/m/messagebundle_en_US_saptrc.properties"
cp "./dist/resources/sap/m/messagebundle_en.properties" "./deploySelection/resources/sap/m/messagebundle_en.properties"

cp "./dist/resources/sap/f/messagebundle.properties" "./deploySelection/resources/sap/f/messagebundle.properties"
cp "./dist/resources/sap/f/messagebundle_de.properties" "./deploySelection/resources/sap/f/messagebundle_de.properties"
cp "./dist/resources/sap/f/messagebundle_en_GB.properties" "./deploySelection/resources/sap/f/messagebundle_en_GB.properties"
cp "./dist/resources/sap/f/messagebundle_en_US_sappsd.properties" "./deploySelection/resources/sap/f/messagebundle_en_US_sappsd.properties"
cp "./dist/resources/sap/f/messagebundle_en_US_saprigi.properties" "./deploySelection/resources/sap/f/messagebundle_en_US_saprigi.properties"
cp "./dist/resources/sap/f/messagebundle_en_US_saptrc.properties" "./deploySelection/resources/sap/f/messagebundle_en_US_saptrc.properties"
cp "./dist/resources/sap/f/messagebundle_en.properties" "./deploySelection/resources/sap/f/messagebundle_en.properties"

cp "./dist/resources/sap/uxap/messagebundle.properties" "./deploySelection/resources/sap/uxap/messagebundle.properties"
cp "./dist/resources/sap/uxap/messagebundle_de.properties" "./deploySelection/resources/sap/uxap/messagebundle_de.properties"
cp "./dist/resources/sap/uxap/messagebundle_en_GB.properties" "./deploySelection/resources/sap/uxap/messagebundle_en_GB.properties"
cp "./dist/resources/sap/uxap/messagebundle_en_US_sappsd.properties" "./deploySelection/resources/sap/uxap/messagebundle_en_US_sappsd.properties"
cp "./dist/resources/sap/uxap/messagebundle_en_US_saprigi.properties" "./deploySelection/resources/sap/uxap/messagebundle_en_US_saprigi.properties"
cp "./dist/resources/sap/uxap/messagebundle_en_US_saptrc.properties" "./deploySelection/resources/sap/uxap/messagebundle_en_US_saptrc.properties"
cp "./dist/resources/sap/uxap/messagebundle_en.properties" "./deploySelection/resources/sap/uxap/messagebundle_en.properties"

cp "./dist/resources/sap/ui/layout/messagebundle.properties" "./deploySelection/resources/sap/ui/layout/messagebundle.properties"
cp "./dist/resources/sap/ui/layout/messagebundle_de.properties" "./deploySelection/resources/sap/ui/layout/messagebundle_de.properties"
cp "./dist/resources/sap/ui/layout/messagebundle_en_GB.properties" "./deploySelection/resources/sap/ui/layout/messagebundle_en_GB.properties"
cp "./dist/resources/sap/ui/layout/messagebundle_en_US_sappsd.properties" "./deploySelection/resources/sap/ui/layout/messagebundle_en_US_sappsd.properties"
cp "./dist/resources/sap/ui/layout/messagebundle_en_US_saprigi.properties" "./deploySelection/resources/sap/ui/layout/messagebundle_en_US_saprigi.properties"
cp "./dist/resources/sap/ui/layout/messagebundle_en_US_saptrc.properties" "./deploySelection/resources/sap/ui/layout/messagebundle_en_US_saptrc.properties"
cp "./dist/resources/sap/ui/layout/messagebundle_en.properties" "./deploySelection/resources/sap/ui/layout/messagebundle_en.properties"

node ./utils/buildSize.js deploySelection
