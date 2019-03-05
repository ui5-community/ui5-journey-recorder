sap.ui.define([
    "sap/ui/base/Object"
], function(UI5Object) {
    "use strict";
    var PageBuilder = UI5Object.extend("com.ui5.testing.model.opa5.PageBuilder", {
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
                existFunction : false
            };

            this.__dependencies.push({asyncDep: this.__namespace.replace(/\./g, '/') + this.__baseClass, paraDep: 'Common'})
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
        this.__actions.enterText = true;
        return this;
    };

    PageBuilder.prototype.addPressFunction = function() {
        if(!this.__dependencies.some(dep => dep.paraDep === 'Press')) {
            this.__dependencies.push({asyncDep: 'sap/ui/test/actions/Press', paraDep: 'Press'});
        }
        this.__actions.press = true;
        return this;
    };

    PageBuilder.prototype.generate = function() {
        var aCode = ['sap.ui.define([\n'];

        this.__generateDependencies(aCode);

        aCode.push(Array(4).join(' ') + '"use strict";\n\n');
        
        this.__generatePageObjectsHeader(aCode);

        aCode.push('});');
        return aCode.reduce((a,b) => a + b, '');
    };

    PageBuilder.prototype.__generateDependencies = function(aCode) {
        this.__dependencies.forEach(dep => aCode.push(Array(4).join(' ') + '\"' + dep.asyncDep + '\",\n'))
        aCode[aCode.length-1] = aCode[aCode.length-1].replace(',', '');
        aCode.push('], function (');
        this.__dependencies.forEach(dep => aCode.push(dep.paraDep + ', '))
        aCode[aCode.length-1] = aCode[aCode.length-1].replace(',', '');
        aCode.push(') {\n');
    };

    PageBuilder.prototype.__generatePageObjectsHeader = function(aCode) {
          var opa5Dependency = Object.values(this.__dependencies).filter(dep => dep.asyncDep === 'sap/ui/test/Opa5')[0].paraDep;
          aCode.push(Array(4).join(' ') + opa5Dependency + '.createPageObjects({\n');
          aCode.push(Array(8).join(' ') + 'on' + this.__viewName + ': {\n');
          aCode.push(Array(12).join(' ') + 'baseClass: ' + this.__baseClass + ',\n');
          aCode.push(Array(12).join(' ') + 'viewName: "' + this.__viewName + '",\n');

          if (Object.values(this.__actions).filter(el=>el).length > 0) {
              aCode.push(Array(12).join(' ')  + 'actions: {\n');

              if(this.__actions.press) {
                  this.__generatePressFunction(aCode);
              }

              if(this.__actions.press && this.__actions.enterText) {
                  aCode[aCode.length -1] = Array(16).join(' ') + '},\n'
              } 

              if(this.__actions.enterText) {
                  this.__generateEnterTextFunction(aCode);
              }

              if(Object.values(this.__assertions).filter(el => el).length > 0) {
                  aCode.push(Array(12).join(' ') + '},\n')            
              } else {
                  aCode.push(Array(12).join(' ') + '}\n')            
              }
          }

          if (Object.values(this.__assertions).filter(el => el).length > 0) {
              aCode.push(Array(12).join(' ') + 'assertions: {\n')
              if(this.__assertions.existFunction) {
                  this.__generateExistFunction(aCode);
              }  
              aCode.push(Array(12).join(' ') + '}\n')
          }
          aCode.push(Array(8).join(' ') + '}\n');
          aCode.push(Array(4).join(' ') + '});\n');
    };

    PageBuilder.prototype.__generateExistFunction = function(aCode) {
            aCode.push(Array(16).join(' ') + 'iShouldSeeTheProperty: function(oMatchProperties) {\n');
            aCode.push(Array(20).join(' ') + 'var checkObject = {};\n');
            aCode.push(Array(20).join(' ') + 'if(oMatchProperties.id) {checkObject.id = new RegExp(oMatchProperties.id);}\n');
            aCode.push(Array(20).join(' ') + 'if(oMatchProperties.controlType) {checkObject.controlType = oMatchProperties.controlType;}\n');
            aCode.push(Array(20).join(' ') + 'checkObject.visible = true;\n');
            //TODO: Add property strict equals for each attribute

            aCode.push(Array(20).join(' ') + 'checkObject.success = function() {"Found field matching all properties"};\n');
            aCode.push(Array(20).join(' ') + 'checkObject.errorMessage = "Won\'t be able to find field with requirements: " + JSON.stringify(oMatchProperties);\n');
            aCode.push(Array(20).join(' ') + 'return this.waitFor(checkObject);\n');
            aCode.push(Array(16).join(' ') + '}\n');
    };

    PageBuilder.prototype.__generateEnterTextFunction = function(aCode) {
        aCode.push(Array(16).join(' ') + 'enterText: function(oActionProperties) {\n');
        aCode.push(Array(20).join(' ') + 'var actionObject = {};\n');
        aCode.push(Array(20).join(' ') + 'if(oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}\n');
        aCode.push(Array(20).join(' ') + 'if(oActionProperties.controlType) {actionObject.controlType = oMatchProperties.controlType;}\n');
        aCode.push(Array(20).join(' ') + 'actionObject.visible = true;\n');
        aCode.push(Array(20).join(' ') + 'actionObject.actions = [new EnterText({text: oActionProperties.actionText})];\n');       
        aCode.push(Array(20).join(' ') + 'actionObject.success = function() {Opa5.assert.ok(true, "Text: " + oActionProperties.actionText + ", successfully inserted.")};\n');         
        aCode.push(Array(20).join(' ') + 'actionObject.errorMessage = "Failed to insert " + oActionProperties.actionText + ;\n');         
        aCode.push(Array(20).join(' ') + 'return this.waitFor(checkObject);\n');
        aCode.push(Array(16).join(' ') + '}\n');
    };

    PageBuilder.prototype.__generatePressFunction = function(aCode) {
        aCode.push(Array(16).join(' ') + 'press: function(oActionProperties) {\n');
        aCode.push(Array(20).join(' ') + 'var actionObject = {};\n');
        aCode.push(Array(20).join(' ') + 'if(oActionProperties.id) {actionObject.id = oActionProperties.id.isRegex ? oActionProperties.id.value : new RegExp(oActionProperties.id.value);}\n');
        aCode.push(Array(20).join(' ') + 'if(oActionProperties.controlType) {actionObject.controlType = oMatchProperties.controlType;}\n');
        aCode.push(Array(20).join(' ') + 'actionObject.visible = true;\n');
        aCode.push(Array(20).join(' ') + 'actionObject.actions = [new Press()];\n');       
        aCode.push(Array(20).join(' ') + 'actionObject.success = function() {Opa5.assert.ok(true, "Press successful.")};\n');         
        aCode.push(Array(20).join(' ') + 'actionObject.errorMessage = "Failed to click";\n');         
        aCode.push(Array(20).join(' ') + 'return this.waitFor(checkObject);\n');
        aCode.push(Array(16).join(' ') + '}\n');
    };

    return PageBuilder;
});