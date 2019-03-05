sap.ui.define([
    "sap/ui/base/Object",
    "com/ui5/testing/model/opa5/PageBuilder"
], function (UI5Object, PageBuilder, CodeHelper) {
    "use strict";
    var OPA5CodeStrategy = UI5Object.extend("com.ui5.testing.model.OPA5CodeStrategy", {
        constructor: function () {
            this.__pages = {};
            this.__code = {
                type: "CODE",
                order: 1,
                content: [],
                constants: []
            };
        }
    });

    OPA5CodeStrategy.prototype.generate = function (oCodeSettings, aElements, codeHelper) {
        var aCodes = [];
        //setup page builder for each view used during the test
        aElements
            .map(el => ({
                viewName: el.item.viewProperty.localViewName,
                namespace: el.item.viewProperty.viewName.replace('.view.' + el.item.viewProperty.localViewName, '')
            }))
            .reduce((a, b) => a.every(c => b.viewName !== c.viewName) ? a.concat(b) : a, [])
            .forEach(el => this.__pages[el.viewName] = (new PageBuilder(el.namespace, el.viewName)));

        this.__namespace = this.__pages[Object.keys(this.__pages)[0]] ? this.__pages[Object.keys(this.__pages)[0]].getNamespace() : 'mock.namespace';

        //(2) execute script
        this.__code.codeName = oCodeSettings.testName;

        this.__setupHeader();

        this.__createConstants(aElements);

        this.__code.content.push('\n\n   QUnit.module("' + oCodeSettings.testCategory + '");\n\n');

        this.__createAppStartStep(oCodeSettings);

        this.__createTestSteps(oCodeSettings, aElements);

        this.__createAppCloseStep(oCodeSettings);

        this.__code.content.push('});');

        this.__code.code = this.__code.content.reduce((a,b) => a+b, '');

        aCodes.push(this.__code);

        var order = 1;
        Object.keys(this.__pages).forEach(function(key) {
            order = order++;
            var oCode = {
                codeName: key,
                type: 'CODE',
                order: order,
                code: this.__pages[key].generate()
            }
            aCodes.push(oCode);
        }.bind(this));

        aCodes.push({
            codeName: 'Common',
            type: 'CODE',
            order: order++,
            code: this.__generateCommonPage()
        });

        return aCodes;
    };

    OPA5CodeStrategy.prototype.__setupHeader = function () {
        var sHeader = 'sap.ui.define([\n';
        sHeader += '    "sap/ui/test/opaQunit"\n';
        sHeader += '], function (opaTest) {\n';
        sHeader += '    "use strict";\n\n';
        this.__code.content.push(sHeader);
    };

    OPA5CodeStrategy.prototype.__createConstants = function(aElements) {
        aElements.forEach(function(el) {
            for(var sK in el.selector.selectorUI5) {
                var properties = el.selector.selectorUI5[sK];
                for (var sPK in properties.properties) {
                    var sValue = Object.values(properties.properties[sPK])[0].trim();
                    var constant = this.__code.constants.filter(c => c.value === sValue)[0];
                    if(constant) {
                        properties.properties[sPK]['constant'] = constant.symbol;
                    } else {
                        var newConstant = this.__createConstant(sValue);
                        this.__code.constants.push(newConstant)
                        properties.properties[sPK]['constant'] = newConstant.symbol;
                    }
                }
            }
        }.bind(this));
        if(this.__code.constants.length > 0) {
            var constants = Array(4).join(' ') + 'var ' + this.__code.constants.map(c => Array(9).join(' ') + c.symbol + ' = \"' + c.value + '\"').reduce((a, b) => a + ',\n' + b, '').substring(2) + ';';
            this.__code.content.push(constants.replace(/var\s{9}/g, 'var  '));
        }
    };

    OPA5CodeStrategy.prototype.__createConstant = function(sString) {
        var constant = {value: sString};
        constant.symbol = 'C_' + sString.replace(/[\s\-\.\:\/]+/g, '_').toUpperCase();
        return constant;
    };

    OPA5CodeStrategy.prototype.__createAppStartStep = function(oAppDetails) {
        var aParts = [Array(4).join(' ') + 'opaTest('];
        aParts.push('"'+ oAppDetails.testName +' App Start"');
        aParts.push(', function(Given, When, Then) {\n');
        aParts.push(Array(8).join(' ') + 'Given.iStartTheAppByUrl({fullUrl: \"' + oAppDetails.testUrl + '\"});\n')
        aParts.push(Array(4).join(' ') + '});\n\n');

        this.__code.content.push(aParts.reduce((a,b) => a + b, ''));
    };

    OPA5CodeStrategy.prototype.__createAppCloseStep = function(oAppDetails) {
        var aParts = [Array(4).join(' ') + 'opaTest('];
        aParts.push('"'+ oAppDetails.testName +' App Teardown"');
        aParts.push(', function(Given, When, Then) {\n');
        aParts.push(Array(8).join(' ') + 'Given.iTeardownTheApp();\n')
        aParts.push(Array(4).join(' ') + '});\n');

        this.__code.content.push(aParts.reduce((a,b) => a + b, ''));
    };

    OPA5CodeStrategy.prototype.__createTestSteps = function(oAppDetails, aTestSteps) {
        var aParts = [Array(4).join(' ') + 'opaTest('];
        aParts.push('"'+ oAppDetails.testName +' Testing"');
        aParts.push(', function(Given, When, Then) {\n');

        //from here starts the real testing
        for(var step in aTestSteps) {
            var stepCode = this.createTestStep(aTestSteps[step]);
            if(stepCode) {
                aParts.push(stepCode);
            }
        }

        aParts.push(Array(4).join(' ') + '});\n\n');

        this.__code.content.push(aParts.reduce((a,b) => a + b, ''));
    };

    OPA5CodeStrategy.prototype.createTestStep = function(oTestStep) {
            var viewName = oTestStep.item.viewProperty.localViewName;
            var namespace = oTestStep.item.viewProperty.viewName.replace('.view.' + oTestStep.item.viewProperty.localViewName, '');

            if(!this.__pages[viewName]) {
                this.__pages[viewName] = new PageBuilder(namespace, viewName);
            }

            switch(oTestStep.property.type) {
                case "ACT":
                    return this.__createActionStep(oTestStep) + '\n';
                case "ASS":
                    return this.__createExistStep(oTestStep) + '\n';
                default:
                    return ;
            }
    };

    OPA5CodeStrategy.prototype.__createActionStep = function(oStep) {
        var actionsType = oStep.property.actKey;
        switch(actionsType) {
            case 'TYP':
                return this.__createEnterTextAction(oStep);
                break;
            case 'PRS':
                return this.__createPressAction(oStep);
                break;
            default:
                console.log('Found a unknown action type: ' + actionsType);
                return "";
        }
    };

    OPA5CodeStrategy.prototype.__flattenProperties = function(aObjects) {
        var tempArray = [];
        if(typeof aObjects === 'object') {
            if(!Array.isArray(aObjects)) {
                if(Object.keys(aObjects).length == 1) {
                    tempArray = [aObjects];
                } else {
                    for(var key in aObjects) {
                        tempArray = [...tempArray, ...this.__flattenProperties(aObjects[key])];
                    }
                }
            } else {
                for(var i = 0; i < aObjects.length; i++) {
                    tempArray = [...tempArray, ...this.__flattenProperties(aObjects[i])];
                }
            }
       }
	   return tempArray;
    };

    OPA5CodeStrategy.prototype.__createSelectorProperties = function(aSelectors) {
        var endObject = {};
        for(var key in aSelectors) {
            switch(key) {
                case 'id':
                    endObject[key] = {value: aSelectors[key].id, isRegex: aSelectors[key].__isRegex};
                    break;
                case 'properties':

                    var newProperties = this.__flattenProperties(aSelectors[key].reduce(
                        function(obj, item) {
                                obj[Object.keys(item)[0]] = Object.values(item)[0];
                                return obj;
                        }, {}));
                    newProperties = this.__flattenProperties(newProperties);
                    endObject['attributes']  ?  endObject['attributes'] = [...endObject['attributes'],...newProperties ] :
                                                endObject['attributes'] = newProperties;
                    break;
                default:
                    endObject[key] = aSelectors[key];
            }
        }
        return JSON.stringify(endObject);
    };

    OPA5CodeStrategy.prototype.__createEnterTextAction = function(oStep) {
        var selectors = oStep.selector.selectorUI5.own;
        var actionInsert = oStep.property.selectActInsert;
        var controlClass = oStep.item.metadata.elementName;
        var viewName = oStep.item.viewProperty.localViewName;
        var controlID = oStep.item.identifier.ui5LocalId;
        this.__pages[viewName].addEnterTextFunction();

        var aParts = [Array(8).join(' ') + 'When.'];
        aParts.push('on' + viewName);
        aParts.push('.enterText(');

        var aSelectorParts = this.__createSelectorProperties(selectors);

        aParts.push(aSelectorParts);
        aParts.push(');');

        return aParts.reduce((a,b) => a + b, '');
    };

    OPA5CodeStrategy.prototype.__createPressAction = function(oStep) {
        var selectors = oStep.selector.selectorUI5.own;
        var actionInsert = oStep.property.selectActInsert;
        var controlClass = oStep.item.metadata.elementName;
        var viewName = oStep.item.viewProperty.localViewName;
        var controlID = oStep.item.identifier.ui5LocalId;
        this.__pages[viewName].addPressFunction();

        var aParts = [Array(8).join(' ') + 'When.'];
        aParts.push('on' + viewName);
        aParts.push('.press(');

        var aSelectorParts = this.__createSelectorProperties(selectors);

        aParts.push(aSelectorParts);
        aParts.push(');');
        return aParts.reduce((a,b) => a + b, '');

    };

    OPA5CodeStrategy.prototype.__createExistStep = function(oStep) {
        this.__pages[oStep.item.viewProperty.localViewName].addExistFunction();
        var aParts = [Array(8).join(' ') + 'Then.'];
        aParts.push('on' + oStep.item.viewProperty.localViewName);
        aParts.push('.iShouldSeeTheProperty({');
        var objectMatcher = {};
        var aToken = [...oStep.attributeFilter, ...oStep.assertFilter];
        for(var id in aToken) {
            //var statBindings = Object.keys(oStep.item.binding).filter(k => oStep.item.binding[k].static).map(i => ({attributeName: i, i18nLabel: oStep.item.binding[i].path}));
            switch(aToken[id].criteriaType) {
                case 'ID': objectMatcher['ID'] = 'id: \"' + aToken[id].criteriaValue + '\"'; break;
                case 'ATTR':
                    this.__createAttrValue(aToken[id], objectMatcher);
                    break;
                case 'MTA':
                    objectMatcher['OBJ_CLASS'] = 'controlType: \"' + aToken[id].criteriaValue + '\"';
                    break;
                case 'BNDG':
                    objectMatcher['BNDG'] = 'i18n: {property: \"' + aToken[id].subCriteriaType + '\", path: \"' + oStep.attributeFilter[id].criteriaValue + '\"}';
                    break;
                default:
                    console.log('Found a unknown class: ' + aToken[id].criteriaType);
            }
        }

        for(var k in objectMatcher) {
            if(k !== 'ATTR') {
                aParts.push(objectMatcher[k] + ', ');
            }
        }

        if(objectMatcher.ATTR) {
            objectMatcher.ATTR = [...new Set(objectMatcher.ATTR)];
            aParts.push("attributes: [" + objectMatcher.ATTR.reduce((a,b) => a +', ' + b, '').substring(2) + "]");
        }
        aParts[aParts.length - 1] = aParts[aParts.length -1].replace(/,\s*$/, '');

        aParts.push('});')

        return aParts.reduce((a,b) => a + b, '');
    };

    OPA5CodeStrategy.prototype.__createAttrValue = function(oToken, objectMatcher) {
        var value = this.__code.constants.filter(c => c.value === oToken.criteriaValue.trim())[0] ?
                    this.__code.constants.filter(c => c.value === oToken.criteriaValue.trim())[0].symbol :
                    this.__sanatize(oToken.criteriaValue.trim());

        if(typeof value === 'object') {
            console.log('stringify object')
        }
        objectMatcher['ATTR'] ?
        objectMatcher['ATTR'].push('{' + oToken.subCriteriaType + ': ' + value + '}') :
        objectMatcher['ATTR'] = ['{' + oToken.subCriteriaType + ': ' + value + '}'];
    };

    OPA5CodeStrategy.prototype.__sanatize = function(sString) {
          return '"' + sString + '"';
    };

    OPA5CodeStrategy.prototype.__generateCommonPage = function() {
        var aCode = [];
        aCode.push('sap.ui.define([\n');
        aCode.push(Array(4).join(' ') + '"sap/ui/test/Opa5",\n');
        aCode.push(Array(4).join(' ') + '"' + this.__namespace.replace(/\./g, '/') + "/MockServer" + '"\n');
        aCode.push('], function(Opa5, MockServer) {\n');
        aCode.push(Array(4).join(' ') + '"use strict";\n\n');
        aCode.push(Array(4).join(' ') + 'var bInOpaPage = location.toString().indexOf("opaTests.qunit.html") !== -1 &&\n');
        aCode.push(Array(21).join(' ') + 'jQuery.sap.getUriParameters().get("component") !== "true";\n\n');
        aCode.push(Array(4).join(' ') + 'function _wrapParameters(oParameters) {\n');
        aCode.push(Array(8).join(' ') + 'return {\n');
        aCode.push(Array(12).join(' ') + 'get: function(name) {\n');
        aCode.push(Array(16).join(' ') + 'return (oParameters[name] || "").toString();\n');
        aCode.push(Array(12).join(' ') + '}\n');
        aCode.push(Array(8).join(' ') + '};\n');
        aCode.push(Array(4).join(' ') + '}\n\n');
        aCode.push(Array(4).join(' ') + 'return Opa5.extend("' + this.__namespace + '.test.integration.Common", {\n');
        aCode.push(Array(8).join(' ') + 'iStartTheAppByUrl: function(oParameters) {\n');
        aCode.push(Array(12).join(' ') + 'if (bInOpaPage || oParameters.fullUrl) {\n');
        aCode.push(Array(16).join(' ') + 'this.iStartMyAppInAFrame(oParameters.fullUrl);\n');
        aCode.push(Array(12).join(' ') + '} else {\n');
        aCode.push(Array(16).join(' ') + 'MockServer.init(_wrapParameters(oParameters || {}));\n');
        aCode.push(Array(16).join(' ') + 'this.iStartMyUIComponent({\n');
        aCode.push(Array(20).join(' ') + 'componentConfig: {\n');
        aCode.push(Array(24).join(' ') + 'name: "' + this.__namespace + '",\n');
        aCode.push(Array(24).join(' ') + 'async: true\n');
        aCode.push(Array(20).join(' ') + '}\n');
        aCode.push(Array(16).join(' ') + '});\n');
        aCode.push(Array(12).join(' ') + '}\n');
        aCode.push(Array(8).join(' ') + '},\n');
        aCode.push(Array(8).join(' ') + 'iTeardownTheApp: function() {\n');
        aCode.push(Array(12).join(' ') + 'if (bInOpaPage) {\n');
        aCode.push(Array(16).join(' ') + 'this.iTeardownMyAppFrame();\n');
        aCode.push(Array(12).join(' ') + '} else {\n');
        aCode.push(Array(16).join(' ') + 'this.iTeardownMyUIComponent();\n');
        aCode.push(Array(12).join(' ') + '}\n');
        aCode.push(Array(8).join(' ') + '}\n');
        aCode.push(Array(4).join(' ') + '});\n');
        aCode.push('});');
        return aCode.reduce((a,b) => a + b, '');
    }

    return OPA5CodeStrategy;
});