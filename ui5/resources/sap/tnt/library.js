/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/base/DataType","sap/ui/core/library","sap/m/library"],function(D){"use strict";sap.ui.getCore().initLibrary({name:"sap.tnt",version:"1.58.5",dependencies:["sap.ui.core","sap.m"],types:["sap.tnt.RenderMode","sap.tnt.BoxContainerLayoutConfiguration"],interfaces:[],controls:["sap.tnt.NavigationList","sap.tnt.ToolHeaderUtilitySeparator","sap.tnt.ToolHeader","sap.tnt.SideNavigation","sap.tnt.ToolPage","sap.tnt.InfoLabel","sap.tnt.BoxContainer","sap.tnt.Box"],elements:["sap.tnt.NavigationListItem"]});sap.tnt.RenderMode={Narrow:"Narrow",Loose:"Loose"};sap.tnt.BoxesPerRowConfig=D.createType("sap.tnt.BoxesPerRowConfig",{isValid:function(v){return/^(([Xx][Ll](?:[1-9]|1[0-2]))? ?([Ll](?:[1-9]|1[0-2]))? ?([Mm](?:[1-9]|1[0-2]))? ?([Ss](?:[1-9]|1[0-2]))?)$/.test(v);}},D.getType("string"));return sap.tnt;});
