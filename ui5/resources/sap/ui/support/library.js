/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/library"],function(l){"use strict";sap.ui.getCore().initLibrary({name:"sap.ui.support",dependencies:["sap.ui.core"],types:["sap.ui.support.Severity"],interfaces:[],controls:[],elements:[],noLibraryCSS:true,version:"1.58.5",extensions:{"sap.ui.support":{internalRules:true}}});sap.ui.support.Severity={Medium:"Medium",High:"High",Low:"Low"};sap.ui.support.Audiences={Control:"Control",Internal:"Internal",Application:"Application"};sap.ui.support.Categories={Accessibility:"Accessibility",Performance:"Performance",Memory:"Memory",Bindings:"Bindings",Consistency:"Consistency",FioriGuidelines:"FioriGuidelines",Functionality:"Functionality",Usability:"Usability",DataModel:"DataModel",Modularization:"Modularization",Usage:"Usage",Other:"Other"};sap.ui.support.HistoryFormats={Abap:"Abap",String:"String"};return sap.ui.support;});
