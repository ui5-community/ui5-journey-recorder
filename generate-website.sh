#!/bin/bash

## regenerate website:

TITLE_PREFIX="UI5 Test Recorder –"


## 1) configure paths etc.

MASTER_BRANCH="dev" # TODO change to master eventually

INPUT_DIR="./website-input"
OUTPUT_DIR="./website-output"

# create folders
mkdir -p "${INPUT_DIR}"
mkdir -p "${OUTPUT_DIR}"

# colors for output
YELLOW="\033[1;33m"
GREEN="\033[0;32m"
NC="\033[0m" # No Color

## 2) copy needed files to input folder

## 2.1) checkout README and CHANGELOG from master branch

echo -e "${YELLOW}### Checking out files from branch '${MASTER_BRANCH}'...${NC}"

# markdown files
git checkout ${MASTER_BRANCH} -- README.md
git checkout ${MASTER_BRANCH} -- CHANGELOG.md
# icon
git checkout ${MASTER_BRANCH} -- images/icon.png
git checkout ${MASTER_BRANCH} -- images/icon.svg

## 2.2) recursively copy all files to input folder

echo -e "${YELLOW}### Copying files to input folder '${INPUT_DIR}'...${NC}"

find . \
    -path "./node_modules" -prune \
    -o -path "./ui5" -prune \
    -o -path "${INPUT_DIR}" -prune \
    -o -path "${OUTPUT_DIR}" -prune \
    -o -name "*.md" \
    -exec cp --parents "{}" "${INPUT_DIR}" \;


## 3) generate website

echo -e "${YELLOW}### Generating HTML from markdown...${NC}"

# push into input folder to retrieve relative paths for all markdown files and the folder structure
pushd "${INPUT_DIR}"
    MDFOLDERS=$(find . -type d)
    MDFILES=$(find . -type f -name "*.md")
popd

# create all output folders
for MDFOLDER in ${MDFOLDERS}; do
    mkdir -p "${OUTPUT_DIR}/${MDFOLDER}"
done

# generate HTML from each markdown file
for MDFILE in ${MDFILES}; do

    INPUT_FILE="${INPUT_DIR}/${MDFILE}"
    OUTPUT_FILE="${OUTPUT_DIR}/${MDFILE%.md}.html"

    echo -e "### Generating HTML for markdown file '${MDFILE}'..."

    npx showdown makehtml \
        --completeHTMLDocument \
        --strikethrough \
        --ghCompatibleHeaderId \
        --simplifiedAutoLink \
        --excludeTrailingPunctuationFromURLs \
        --requireSpaceBeforeHeadingText \
        --encodeEmails \
        -i "${INPUT_FILE}" \
        -o "${OUTPUT_FILE}"

    echo -e "### Post-processing..."

    # post-processing:
    # 0) calculate number of subfolders to ensure correct relative paths
    # 0.1) count slashes in path
    SUBFOLDER_SLASHES="${MDFILE//[^\/]}"
    NUMBER_SUBFOLDERS=$(expr ${#SUBFOLDER_SLASHES} - 1)
    # 0.2) construct path prefix to allow nested folders
    PATH_PREFIX=""
    if [ $NUMBER_SUBFOLDERS -gt 0 ]; then
        PATH_PREFIX=$(yes "../" | head -${NUMBER_SUBFOLDERS})
    fi
    # 1) add meta tags to head
    HEADERTAGS="\
        <title>${TITLE_PREFIX} $(basename ${MDFILE%.md})</title>\n\
        <meta name='language' content='en'>\n\
        <link rel='stylesheet' href='${PATH_PREFIX}assets/css/style.css' />\n\
        <link rel='stylesheet' href='${PATH_PREFIX}assets/css/pilcrow.css' />\n\
        <link type='text/css' rel='stylesheet' href='${PATH_PREFIX}assets/css/hljs-github.min.css' />"
    sed -i -e "/<\/head>/i\\$HEADERTAGS" "${OUTPUT_FILE}"
    # 2) add div wrapper for better layout
    WRAPPERSTART="<div id='wrapper'><div id='main'><div id='content' class='post'>"
    WRAPPEREND="</div></div></div>"
    sed -i -e "/<body>/a\\$WRAPPERSTART" "${OUTPUT_FILE}"
    sed -i -e "/<\/body>/i\\$WRAPPEREND" "${OUTPUT_FILE}"
    # 3) rewrite links to .md files (use .html endings instead)
    sed -i -e "s,href=\"\(.*\)\.md\(#.*\)\?\",href=\"\1.html\2\",g" "${OUTPUT_FILE}"

done


## 4) copy generated files back to main folder

echo -e "${YELLOW}### Copying generated files back to main folder...${NC}"

# push into output folder as the
pushd "${OUTPUT_DIR}"

    find . -type f -exec cp --parents "{}" ../ \;

popd


## 5) clean up

echo -e "${YELLOW}### Cleaning up...${NC}"

rm -rf "${INPUT_DIR}"
rm -rf "${OUTPUT_DIR}"


## 6) display user messages

echo -e "${GREEN}### Generation finished. Be sure to check for errors and commit any changes later!${NC}"
