/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['sap/ui/rta/command/FlexCommand'],function(F){"use strict";var C=F.extend("sap.ui.rta.command.CreateContainer",{metadata:{library:"sap.ui.rta",properties:{index:{type:"int"},newControlId:{type:"string"},label:{type:"string"},parentId:{type:"string"}},associations:{},events:{}}});C.prototype._getChangeSpecificData=function(f){var s={changeType:this.getChangeType(),index:this.getIndex(),newControlId:this.getNewControlId(),newLabel:this.getLabel(),parentId:this.getParentId()};return s;};return C;},true);
