/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["jquery.sap.global"],function(q){"use strict";var B={initSupportRules:function(s,d){sap.ui.require(["sap/ui/support/supportRules/Main"],function(M){if(s[0].toLowerCase()==="true"||s[0].toLowerCase()==="silent"){if(d&&d.onReady&&typeof d.onReady==="function"){M.attachEvent("ready",d.onReady);}M.startPlugin(s);if('logSupportInfo'in q.sap.log){q.sap.log.logSupportInfo(true);}}});}};return B;});
