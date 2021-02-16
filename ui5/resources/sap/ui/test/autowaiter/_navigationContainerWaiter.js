/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/test/_OpaLogger","sap/ui/test/_opaCorePlugin","sap/base/util/ObjectPath"],function(_,a,O){"use strict";var h=_.getLogger("sap.ui.test.autowaiter._navigationContainerWaiter#hasPending");function b(){var c="sap.m.NavContainer";var n=O.get(c);if(sap.ui.lazyRequire._isStub(c)||!n){return false;}return a.getAllControls(n).some(function(N){if(N._bNavigating){h.debug("The NavContainer "+N+" is currently navigating");}return N._bNavigating;});}return{hasPending:b};});
