/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['../Element','../library','./DragAndDrop'],function(E,l){"use strict";var D=E.extend("sap.ui.core.dnd.DragDropBase",{metadata:{"abstract":true,library:"sap.ui.core",properties:{groupName:{type:"string",defaultValue:null,invalidate:false},enabled:{type:"boolean",defaultValue:true}}}});D.prototype.isDraggable=function(c){return false;};D.prototype.isDroppable=function(c,e){return false;};D.prototype.setEnabled=function(e){return this.setProperty("enabled",e,!this.isA("sap.ui.core.dnd.IDragInfo"));};D.prototype.setProperty=function(p,v,s){s=s||(this.getMetadata().getProperty(p).appData||{}).invalidate===false;return E.prototype.setProperty.call(this,p,v,s);};return D;});
