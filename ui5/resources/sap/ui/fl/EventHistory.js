/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(function(){"use strict";var E=function(){};E._aEventIds=["ControlForPersonalizationRendered"];E._aUnsubscribedEventIds=[];E._oHistory={};E.start=function(){E._aEventIds.forEach(function(e){if(E._aUnsubscribedEventIds.indexOf(e)===-1){sap.ui.getCore().getEventBus().subscribe("sap.ui",e,E.saveEvent);E._oHistory[e]=[];}});};E.saveEvent=function(c,e,p){var o={"channelId":c,"eventId":e,"parameters":p};if(E._oHistory[e]){E._oHistory[e].push(o);}};E.getHistoryAndStop=function(e){sap.ui.getCore().getEventBus().unsubscribe("sap.ui",e,E.saveEvent);E._addUnsubscribedEvent(e);return E._oHistory[e]||[];};E._addUnsubscribedEvent=function(e){if(E._aUnsubscribedEventIds.indexOf(e)===-1){E._aUnsubscribedEventIds.push(e);}};return E;},true);
