/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/fl/RegistrationDelegator"],function(R){"use strict";sap.ui.getCore().initLibrary({name:"sap.ui.fl",version:"1.58.5",controls:["sap.ui.fl.variants.VariantManagement"],dependencies:["sap.ui.core","sap.m"],designtime:"sap/ui/fl/designtime/library.designtime",extensions:{"sap.ui.support":{diagnosticPlugins:["sap/ui/fl/support/Flexibility"],publicRules:true}}});sap.ui.fl.Scenario={AppVariant:"APP_VARIANT",AdaptationProject:"ADAPTATION_PROJECT",FioriElementsFromScratch:"FE_FROM_SCRATCH",UiAdaptation:"UI_ADAPTATION"};R.registerAll();return sap.ui.fl;});
