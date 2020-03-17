#!/bin/bash

## regenerate website:


## 1) configure paths etc.

MASTER_BRANCH="communication-update" # TODO change to master eventually

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

# configuration
LAYOUT="mixu-page"

# generate using generate-md
npx generate-md --layout "${LAYOUT}" --input "${INPUT_DIR}" --output "${OUTPUT_DIR}"


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
