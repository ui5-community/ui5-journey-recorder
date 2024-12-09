# i can choose multiple folders with {} and random depth levels with **
for file in ./out/*.js
do 
    sed -i "/import RootTemplate from '.\/RootTemplate';/c\import RootTemplate from '.\/RootTemplate.mjs';" "$file"
    sed -i "/import PageTemplate from '.\/PageTemplate';/c\import PageTemplate from '.\/PageTemplate.mjs';" "$file"
    sed -i "/import JourneyTemplate from '.\/JourneyTemplate';/c\import JourneyTemplate from '.\/JourneyTemplate.mjs';" "$file"
    sed -i "/import \{ JSMethodTemplate\, JSPageTemplate\, TSMethodTemplate\, TSPageTemplate \} from '.\/Templates';/c\import \{ JSMethodTemplate\, JSPageTemplate\, TSMethodTemplate\, TSPageTemplate \} from '.\/Templates.mjs';" "$file"
    mv "$file" "${file%.js}.mjs"
done