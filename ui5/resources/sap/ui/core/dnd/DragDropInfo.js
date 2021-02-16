/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./DragInfo","./DropInfo","sap/base/Log"],function(D,a,L){"use strict";var b=a.extend("sap.ui.core.dnd.DragDropInfo",{metadata:{library:"sap.ui.core",interfaces:["sap.ui.core.dnd.IDragInfo","sap.ui.core.dnd.IDropInfo"],properties:{sourceAggregation:{type:"string",defaultValue:null}},associations:{targetElement:{type:"sap.ui.core.Element",multiple:false}},events:{dragStart:{allowPreventDefault:true},dragEnd:{}}}});b.prototype.isDraggable=D.prototype.isDraggable;b.prototype.fireDragEnd=D.prototype.fireDragEnd;b.prototype.fireDragStart=D.prototype.fireDragStart;b.prototype.getDropTarget=function(){var t=this.getTargetElement();if(t){return sap.ui.getCore().byId(t);}return this.getParent();};b.prototype.setGroupName=function(){L.error("groupName property must not be set on "+this);return this;};return b;},true);
