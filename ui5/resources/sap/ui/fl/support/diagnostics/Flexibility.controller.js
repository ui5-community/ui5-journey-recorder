/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/mvc/Controller","sap/ui/model/Filter","sap/ui/model/FilterOperator","sap/ui/fl/support/Flexibility","sap/ui/fl/support/apps/uiFlexibilityDiagnostics/helper/Extractor"],function(C,F,a,b,E){"use strict";return C.extend("sap.ui.fl.support.diagnostics.Flexibility",{refreshApps:function(){this.getView().getViewData().plugin.onRefresh();},extractAppData:function(e){var s=e.getSource();var B=s.getBindingContext("flexApps");var d=B.getProperty("data");E.createDownloadFile(d);}});});
