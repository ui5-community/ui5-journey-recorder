# i can choose multiple folders with {} and random depth levels with **
for file in ./out/*.js
do 
    sed -i "/import Generator from '.\/Generator';/c\import Generator from '.\/Generator.mjs';" "$file"
    sed -i "/import wdi5Generator from '.\/wdi5Generator';/c\import wdi5Generator from '.\/wdi5Generator.mjs';" "$file"
    sed -i "/import opa5Generator from '.\/opa5Generator';/c\import opa5Generator from '.\/opa5Generator.mjs';" "$file"
    sed -i "/import JourneyGenerator from '.\/JourneyGenerator';/c\import JourneyGenerator from '.\/JourneyGenerator.mjs';" "$file"
    sed -i "/import { PageGenerator } from '.\/PageGenerator';/c\import { PageGenerator } from '.\/PageGenerator.mjs';" "$file"
    sed -i "/import opa5PageGenerator from '.\/opa5PageGenerator';/c\import opa5PageGenerator from '.\/opa5PageGenerator.mjs';" "$file"
    sed -i "/import wdi5PageGenerator from '.\/wdi5PageGenerator';/c\import wdi5PageGenerator from '.\/wdi5PageGenerator.mjs';" "$file"
    sed -i "/import { TSTemplate, JSTemplate, TSImportTemplate, JSImportTemplate } from '.\/wdi5Templates';/c\import { TSTemplate, JSTemplate, TSImportTemplate, JSImportTemplate } from '.\/wdi5Templates.mjs';" "$file"
    sed -i "/import { JSImportTemplate, JSMethodTemplate, JSTemplate, TSImportTemplate, TSMethodTemplate, TSTemplate } from '.\/opa5Templates';/c\import { JSImportTemplate, JSMethodTemplate, JSTemplate, TSImportTemplate, TSMethodTemplate, TSTemplate } from './opa5Templates.mjs';" "$file"
    sed -i "/import { JSMethodImplementationTemplate, JSPageTemplate, JSActionImportTemplate, TSMethodImplementationTemplate, TSPageTemplate, TSActionImportTemplate, ActionsTemplate } from '.\/opa5Templates';/c\import { JSMethodImplementationTemplate, JSPageTemplate, JSActionImportTemplate, TSMethodImplementationTemplate, TSPageTemplate, TSActionImportTemplate, ActionsTemplate } from './opa5Templates.mjs';" "$file"
    sed -i "/import { JSMethodTemplate, JSPageTemplate, JSImportTemplate, TSMethodTemplate, TSPageTemplate, TSImportTemplate, ActionsTemplate } from '.\/PageTemplates';/c\import { JSMethodTemplate, JSPageTemplate, JSImportTemplate, TSMethodTemplate, TSPageTemplate, TSImportTemplate, ActionsTemplate } from '.\/PageTemplates.mjs';" "$file"
    sed -i "/import { JSActionMethodTemplate, JSAssertionMethodTemplate, JSPageTemplate, TSActionMethodTemplate, TSAssertionMethodTemplate, TSControlImport, TSPageTemplate } from '.\/wdi5Templates';/c\import { JSActionMethodTemplate, JSAssertionMethodTemplate, JSPageTemplate, TSActionMethodTemplate, TSAssertionMethodTemplate, TSControlImport, TSPageTemplate } from '.\/wdi5Templates.mjs';" "$file"
   
    mv "$file" "${file%.js}.mjs"
done