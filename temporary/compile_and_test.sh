#!/bin/bash
echo "Compiling.."
npx tsc --outDir "./out"
echo "Rename imports.."
./rename.sh 
clear 
echo "Running generation.."
node ./out/interfacing.mjs