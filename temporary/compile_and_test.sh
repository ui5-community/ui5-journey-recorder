#!/bin/bash

npx tsc --outDir "./out" && ./rename.sh && clear && node ./out/interfacing.mjs