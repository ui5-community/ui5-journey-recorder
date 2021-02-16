/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log"],function(L){"use strict";var l=[];var o={onLogEntry:function(a){if(a.component.match(/^sap.ui.test.autowaiter.*#hasPending$/)){l.push(a.message);}}};return{start:function(){L.addLogListener(o);},getAndClearLog:function(){var s=l.join("\n");l.length=0;return s;},stop:function(){l.length=0;L.removeLogListener(o);}};},true);
