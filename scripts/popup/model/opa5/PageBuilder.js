sap.ui.define([
    "sap/ui/base/Object"
], function(UI5Object) {
    "use strict";

    var PageBuilder = UI5Object.extend("com.ui5.testing.model.opa5.PageBuilder", {
        /**
         * Simple constructor instantiating all the member variables
         *
         * @param namespace
         * @param viewName
         * @param baseClass
         */
        constructor: function(namespace, viewName, baseClass) {
            this.__namespace = namespace ? namespace: "template";
            this.__viewName = viewName ? viewName : "view1";
            this.__baseClass = baseClass ?  baseClass: "Common";
            this.__dependencies = [{asyncDep: 'sap/ui/test/Opa5', paraDep: 'Opa5'}];
            this.__actions = {
                enterText: false,
                press: false
            };
            this.__assertions = {
                existFunction : false,
                aggEmptyFunction: false,
                aggFillFunction: false,
                aggCntFunction: false
            };
            this.__dependencies.push({asyncDep: this.__namespace.replace(/\./g, '/') + '/<testPath>/' +this.__baseClass, paraDep: 'Common'})
        }
    });

    PageBuilder.prototype.setNameSpace = function(sNamespace) {
        this.__namespace = sNamespace ? sNamespace : this.__namespace;
        return this;
    };

    PageBuilder.prototype.getNamespace = function() {
        return this.__namespace;
    };

    PageBuilder.prototype.setViewName = function(sViewName) {
        this.__viewName = sViewName ? sViewName : this.__viewName;
        return this;
    };

    PageBuilder.prototype.setBaseClass = function(sBaseClass) {
        this.__baseClass = sBaseClass ? sBaseClass : this.__baseClass;
        return this;
    };

    PageBuilder.prototype.addExistFunction = function() {
        if(!this.__dependencies.some(dep => dep.paraDep === 'PropertyStrictEquals')) {
            this.__dependencies.push({asyncDep: 'sap/ui/test/matchers/PropertyStrictEquals', paraDep: 'PropertyStrictEquals'});
        }
        this.__assertions.existFunction = true;
        return this;
    };

    PageBuilder.prototype.addEnterTextFunction = function() {
        if(!this.__dependencies.some(dep => dep.paraDep === 'EnterText')) {
            this.__dependencies.push({asyncDep: 'sap/ui/test/actions/EnterText', paraDep: 'EnterText'});
        }
        if(!this.__dependencies.some(dep => dep.paraDep === 'PropertyStrictEquals')) {
            this.__dependencies.push({asyncDep: 'sap/ui/test/matchers/PropertyStrictEquals', paraDep: 'PropertyStrictEquals'});
        }
        this.__actions.enterText = true;
        return this;
    };

    PageBuilder.prototype.addPressFunction = function() {
        if(!this.__dependencies.some(dep => dep.paraDep === 'Press')) {
            this.__dependencies.push({asyncDep: 'sap/ui/test/actions/Press', paraDep: 'Press'});
        }
        if(!this.__dependencies.some(dep => dep.paraDep === 'PropertyStrictEquals')) {
            this.__dependencies.push({asyncDep: 'sap/ui/test/matchers/PropertyStrictEquals', paraDep: 'PropertyStrictEquals'});
        }
        this.__actions.press = true;
        return this;
    };

    PageBuilder.prototype.addAggregationEmpty = function() {
        if(!this.__dependencies.some(dep => dep.paraDep === 'AggregationEmpty')) {
            this.__dependencies.push({asyncDep: 'sap/ui/test/matchers/AggregationEmpty', paraDep: 'AggregationEmpty'});
        }
        this.__assertions.aggEmptyFunction = true;
        return this;
    };

    PageBuilder.prototype.addAggregationFilled = function() {
        if(!this.__dependencies.some(dep => dep.paraDep === 'AggregationFilled')) {
            this.__dependencies.push({asyncDep: 'sap/ui/test/matchers/AggregationFilled', paraDep: 'AggregationFilled'});
        }
        this.__assertions.aggFillFunction = true;
        return this;
    };

    PageBuilder.prototype.addAggregationCount = function() {
        if(!this.__dependencies.some(dep => dep.paraDep === 'AggregationLengthEquals')) {
            this.__dependencies.push({asyncDep: 'sap/ui/test/matchers/AggregationLengthEquals', paraDep: 'AggregationLengthEquals'});
        }
        this.__assertions.aggCntFunction = true;
        return this;
    };

    PageBuilder.prototype.generate = function() {
        var aCode = ['sap.ui.define([\n'];

        this.__generateDependencies(aCode);

        aCode.push(Array(2).join('\t') + '"use strict";\n\n');

        this.__generatePageObjectsHeader(aCode);

        aCode.push('});');
        return aCode.reduce((a,b) => a + b, '');
    };

    PageBuilder.prototype.__generateDependencies = function(aCode) {
        this.__dependencies.forEach(dep => aCode.push(Array(2).join('\t') + '\"' + dep.asyncDep + '\",\n'))
        aCode[aCode.length-1] = aCode[aCode.length-1].replace(',', '');
        aCode.push('], function (');
        this.__dependencies.forEach(dep => aCode.push(dep.paraDep + ', '))
        aCode[aCode.length-1] = aCode[aCode.length-1].replace(',', '');
        aCode.push(') {\n');
    };

    PageBuilder.prototype.__generatePageObjectsHeader = function(aCode) {
          var opa5Dependency = Object.values(this.__dependencies).filter(dep => dep.asyncDep === 'sap/ui/test/Opa5')[0].paraDep;
          aCode.push(Array(2).join('\t') + opa5Dependency + '.createPageObjects({\n');
          aCode.push(Array(3).join('\t') + 'on' + this.__viewName + ': {\n');
          aCode.push(Array(4).join('\t') + 'baseClass: ' + this.__baseClass + ',\n');
          aCode.push(Array(4).join('\t') + 'viewName: "' + this.__viewName + '",\n');

          if (Object.values(this.__actions).filter(el=>el).length > 0) {
              aCode.push(Array(4).join('\t')  + 'actions: {\n');

              if(this.__actions.press) {
                  this.__generatePressFunction(aCode);
              }

              if(this.__actions.press && this.__actions.enterText) {
                  aCode[aCode.length -1] = Array(5).join('\t') + '},\n'
              }

              if(this.__actions.enterText) {
                  this.__generateEnterTextFunction(aCode);
              }

              if(Object.values(this.__assertions).filter(el => el).length > 0) {
                  aCode.push(Array(4).join('\t') + '},\n')
              } else {
                  aCode.push(Array(4).join('\t') + '}\n')
              }
          }

          if (Object.values(this.__assertions).filter(el => el).length > 0) {
              aCode.push(Array(4).join('\t') + 'assertions: {\n')
              if(this.__assertions.existFunction) {
                  this.__generateExistFunction(aCode);
              }

              if(this.__assertions.aggEmptyFunction){
                  if(aCode[aCode.length-1].indexOf('}\n') > -1){
                    aCode.push(',\n');
                  }
                  this.__generateEmptyAggFunction(aCode);
              }

              if(this.__assertions.aggFillFunction){
                  if(aCode[aCode.length-1].indexOf('}\n') > -1){
                    aCode.push(',\n');
                  }
                  this.__generateFilledAggFunction(aCode);
              }

              if(this.__assertions.aggCntFunction){
                  if(aCode[aCode.length-1].indexOf('}\n') > -1){
                    aCode.push(',\n');
                  }
                  this.__generateCountAggFunction(aCode);
              }

              aCode[aCode.length - 1] = aCode[aCode.length - 1].replace(/,\n\s*$/, '');

              aCode.push(Array(4).join('\t') + '}\n')
          }
          aCode.push(Array(3).join('\t') + '}\n');
          aCode.push(Array(2).join('\t') + '});\n');
    };

    PageBuilder.prototype.__generateExistFunction = function(aCode) {
            aCode.push(Array(5).join('\t') + 'iShouldSeeTheProperty: function(oMatchProperties) {\n');
            aCode.push(Array(6).join('\t') + 'var checkObject = {};\n');
            aCode.push(Array(6).join('\t') + 'if (oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}\n');
            aCode.push(Array(6).join('\t') + 'if (oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}\n');
            aCode.push(Array(6).join('\t') + 'checkObject.visible = true;\n');
            aCode.push(Array(6).join('\t') + 'checkObject.success = function() {Opa5.assert.ok(true,"Found field matching all properties")};\n');
            aCode.push(Array(6).join('\t') + 'checkObject.errorMessage = "Won\'t be able to find field with requirements: " + JSON.stringify(oMatchProperties);\n');
            aCode.push(Array(6).join('\t') + 'checkObject.matchers =\n');
            aCode.push(Array(7).join('\t') + 'oMatchProperties.attributes.map(function(el) {\n');
            aCode.push(Array(8).join('\t') + 'return new PropertyStrictEquals({name: Object.keys(el)[0], value: Object.values(el)[0]});\n');
            aCode.push(Array(7).join('\t') + '});\n');
            aCode.push(Array(6).join('\t') + 'return this.waitFor(checkObject);\n');
            aCode.push(Array(5).join('\t') + '}\n');
    };

    PageBuilder.prototype.__generateEmptyAggFunction = function(aCode) {
        aCode.push(Array(5).join('\t') + 'iAggregationEmpty: function(oAggProperties) {\n');
        aCode.push(Array(6).join('\t') + 'var checkObject = {};\n');
        aCode.push(Array(6).join('\t') + 'if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}\n');
        aCode.push(Array(6).join('\t') + 'if (oAggProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}\n');
        aCode.push(Array(6).join('\t') + 'checkObject.visible = true;\n');
        aCode.push(Array(6).join('\t') + 'checkObject.success = function() {Opa5.assert.ok(true,"Found aggregation empty.")};\n');
        aCode.push(Array(6).join('\t') + 'checkObject.errorMessage = "Won\'t be able to find aggregation with requirements: " + JSON.stringify(oAggProperties);\n');
        aCode.push(Array(6).join('\t') + 'checkObject.matchers =\n');
        aCode.push(Array(7).join('\t') + 'oMatchProperties.attributes.map(function(el) {\n');
        aCode.push(Array(8).join('\t') + 'return new PropertyStrictEquals({name: Object.keys(el)[0], value: Object.values(el)[0]});\n');
        aCode.push(Array(7).join('\t') + '});\n');
        aCode.push(Array(6).join('\t') + 'checkObject.matchers.push(\n');
        aCode.push(Array(7).join('\t') + 'new AggregationEmpty({\n');
        aCode.push(Array(8).join('\t') + 'name: oAggProperties.aggName\n');
        aCode.push(Array(7).join('\t') + '}));\n');
        aCode.push(Array(6).join('\t') + 'return this.waitFor(checkObject);\n');
        aCode.push(Array(5).join('\t') + '}\n');
    };

    PageBuilder.prototype.__generateFilledAggFunction = function(aCode) {
        aCode.push(Array(5).join('\t') + 'iAggregationFilled: function(oAggProperties) {\n');
        aCode.push(Array(6).join('\t') + 'var checkObject = {};\n');
        aCode.push(Array(6).join('\t') + 'if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}\n');
        aCode.push(Array(6).join('\t') + 'if (oAggProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}\n');
        aCode.push(Array(6).join('\t') + 'checkObject.visible = true;\n');
        aCode.push(Array(6).join('\t') + 'checkObject.success = function() {Opa5.assert.ok(true,"Found aggregation filled.")};\n');
        aCode.push(Array(6).join('\t') + 'checkObject.errorMessage = "Won\'t be able to find aggregation with requirements: " + JSON.stringify(oAggProperties);\n');
        aCode.push(Array(6).join('\t') + 'checkObject.matchers =\n');
        aCode.push(Array(7).join('\t') + 'oMatchProperties.attributes.map(function(el) {\n');
        aCode.push(Array(8).join('\t') + 'return new PropertyStrictEquals({name: Object.keys(el)[0], value: Object.values(el)[0]});\n');
        aCode.push(Array(7).join('\t') + '});\n');
        aCode.push(Array(6).join('\t') + 'checkObject.matchers.push(\n');
        aCode.push(Array(7).join('\t') + 'new AggregationFilled({\n');
        aCode.push(Array(8).join('\t') + 'name: oAggProperties.aggName\n');
        aCode.push(Array(7).join('\t') + '}));\n');
        aCode.push(Array(6).join('\t') + 'return this.waitFor(checkObject);\n');
        aCode.push(Array(5).join('\t') + '}\n');
    };

    PageBuilder.prototype.__generateCountAggFunction = function(aCode) {
        aCode.push(Array(5).join('\t') + 'iAggregationCounts: function(oAggProperties) {\n');
        aCode.push(Array(6).join('\t') + 'var checkObject = {};\n');
        aCode.push(Array(6).join('\t') + 'if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}\n');
        aCode.push(Array(6).join('\t') + 'if (oAggProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}\n');
        aCode.push(Array(6).join('\t') + 'checkObject.visible = true;\n');
        aCode.push(Array(6).join('\t') + 'checkObject.success = function() {Opa5.assert.ok(true,"Found aggregation matching count of " + oAggProperties.count)};\n');
        aCode.push(Array(6).join('\t') + 'checkObject.errorMessage = "Won\'t be able to find aggregation with requirements: " + JSON.stringify(oAggProperties);\n');
        aCode.push(Array(6).join('\t') + 'checkObject.matchers =\n');
        aCode.push(Array(7).join('\t') + 'oMatchProperties.attributes.map(function(el) {\n');
        aCode.push(Array(8).join('\t') + 'return new PropertyStrictEquals({name: Object.keys(el)[0], value: Object.values(el)[0]});\n');
        aCode.push(Array(7).join('\t') + '});\n');
        aCode.push(Array(6).join('\t') + 'checkObject.matchers.push(\n');
        aCode.push(Array(7).join('\t') + 'new AggregationLengthEquals({\n');
        aCode.push(Array(8).join('\t') + 'name: oAggProperties.aggName,\n');
        aCode.push(Array(8).join('\t') + 'length: oAggProperties.count\n');
        aCode.push(Array(7).join('\t') + '}));\n');
        aCode.push(Array(6).join('\t') + 'return this.waitFor(checkObject);\n');
        aCode.push(Array(5).join('\t') + '}\n');
    };

    PageBuilder.prototype.__generateEnterTextFunction = function(aCode) {
        aCode.push(Array(5).join('\t') + 'enterText: function(oActionProperties) {\n');
        aCode.push(Array(6).join('\t') + 'var actionObject = {};\n');
        aCode.push(Array(6).join('\t') + 'if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}\n');
        aCode.push(Array(6).join('\t') + 'if (oActionProperties.controlType) {actionObject.controlType = oActionProperties.controlType;}\n');
        aCode.push(Array(6).join('\t') + 'actionObject.visible = true;\n');
        aCode.push(Array(6).join('\t') + 'actionObject.actions = [new EnterText({text: oActionProperties.actionText})];\n');
        aCode.push(Array(6).join('\t') + 'actionObject.success = function() {Opa5.assert.ok(true, "Text: " + oActionProperties.actionText + ", successfully inserted.")};\n');
        aCode.push(Array(6).join('\t') + 'actionObject.errorMessage = "Failed to insert " + oActionProperties.actionText;\n');
        aCode.push(Array(6).join('\t') + 'if (oActionProperties.attributes) {\n');
        aCode.push(Array(7).join('\t') + 'actionObject.matchers =\n');
        aCode.push(Array(8).join('\t') + 'oActionProperties.attributes.map(function(el) {\n');
        aCode.push(Array(9).join('\t') + 'return new PropertyStrictEquals({name: Object.keys(el)[0], value: Object.values(el)[0]});\n');
        aCode.push(Array(8).join('\t') + '});\n');
        aCode.push(Array(6).join('\t') + '}\n');
        aCode.push(Array(6).join('\t') + 'return this.waitFor(actionObject);\n');
        aCode.push(Array(5).join('\t') + '}\n');
    };

    PageBuilder.prototype.__generatePressFunction = function(aCode) {
        aCode.push(Array(5).join('\t') + 'press: function(oActionProperties) {\n');
        aCode.push(Array(6).join('\t') + 'var actionObject = {};\n');
        aCode.push(Array(6).join('\t') + 'if (oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}\n');
        aCode.push(Array(6).join('\t') + 'if (oActionProperties.controlType) {actionObject.controlType = oActionProperties.controlType;}\n');
        aCode.push(Array(6).join('\t') + 'actionObject.visible = true;\n');
        aCode.push(Array(6).join('\t') + 'actionObject.actions = [new Press()];\n');
        aCode.push(Array(6).join('\t') + 'actionObject.success = function() {Opa5.assert.ok(true, "Press successful.")};\n');
        aCode.push(Array(6).join('\t') + 'actionObject.errorMessage = "Failed to click";\n');
        aCode.push(Array(6).join('\t') + 'if (oActionProperties.attributes) {\n');
        aCode.push(Array(7).join('\t') + 'actionObject.matchers =\n');
        aCode.push(Array(8).join('\t') + 'oActionProperties.attributes.map(function(el) {\n');
        aCode.push(Array(9).join('\t') + 'return new PropertyStrictEquals({name: Object.keys(el)[0], value: Object.values(el)[0]});\n');
        aCode.push(Array(8).join('\t') + '});\n');
        aCode.push(Array(6).join('\t') + '}\n');
        aCode.push(Array(6).join('\t') + 'return this.waitFor(actionObject);\n');
        aCode.push(Array(5).join('\t') + '}\n');
    };

    return PageBuilder;
});