/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/UIComponent"],function(U){"use strict";var _,a;return U.extend("sap.ui.rta.appVariant.manageApps.webapp.Component",{metadata:{"manifest":"json","library":"sap.ui.rta","version":"0.9","properties":{"idRunningApp":"string",isOverviewForKeyUser:{type:"boolean"}}},constructor:function(){_=arguments[1].idRunningApp;a=arguments[1].isOverviewForKeyUser;U.prototype.constructor.apply(this,arguments);},init:function(){this.setIdRunningApp(_);this.setIsOverviewForKeyUser(a);U.prototype.init.apply(this,arguments);}});});
