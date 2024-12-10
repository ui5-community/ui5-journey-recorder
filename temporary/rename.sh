# i can choose multiple folders with {} and random depth levels with **
for file in ./out/*.js
do 
    sed -i "/import AbstractGenerator from '.\/AbstractGenerator';/c\import AbstractGenerator from '.\/AbstractGenerator.mjs';" "$file"
    sed -i "/import AbstractPageGenerator from '.\/AbstractPageGenerator';/c\import AbstractPageGenerator from '.\/AbstractPageGenerator.mjs';" "$file"
    sed -i "/import PageGenerator from '.\/PageGenerator';/c\import PageGenerator from '.\/PageGenerator.mjs';" "$file"
    sed -i "/import JourneyGenerator from '.\/JourneyGenerator';/c\import JourneyGenerator from '.\/JourneyGenerator.mjs';" "$file"
    sed -i "/import wdi5Generator from '.\/wdi5Generator';/c\import wdi5Generator from '.\/wdi5Generator.mjs';" "$file"
    sed -i "/import { TSTemplate, JSTemplate, TSImportTemplate, JSImportTemplate } from '.\/wdi5Templates';/c\import { TSTemplate, JSTemplate, TSImportTemplate, JSImportTemplate } from '.\/wdi5Templates.mjs';" "$file"
    sed -i "/import { JSMethodTemplate, JSPageTemplate, JSImportTemplate, TSMethodTemplate, TSPageTemplate, TSImportTemplate, ActionsTemplate } from '.\/PageTemplates';/c\import { JSMethodTemplate, JSPageTemplate, JSImportTemplate, TSMethodTemplate, TSPageTemplate, TSImportTemplate, ActionsTemplate } from '.\/PageTemplates.mjs';" "$file"
    sed -i "/import { JSTemplate, JSMethodTemplate, TSTemplate, TSMethodTemplate, JSImportTemplate, TSImportTemplate, TSPageConstantTemplate } from '.\/JourneyTemplates';/c\import { JSTemplate, JSMethodTemplate, TSTemplate, TSMethodTemplate, JSImportTemplate, TSImportTemplate, TSPageConstantTemplate } from '.\/JourneyTemplates.mjs';" "$file"
    mv "$file" "${file%.js}.mjs"
done