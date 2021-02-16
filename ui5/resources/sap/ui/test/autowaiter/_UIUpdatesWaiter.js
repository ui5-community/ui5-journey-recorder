/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/test/_OpaLogger","sap/ui/test/_opaCorePlugin"],function(_,a){"use strict";var h=_.getLogger("sap.ui.test.autowaiter._UIUpdatesWaiter#hasPending");return{hasPending:function(){var u=a.isUIDirty();if(u){h.debug("The UI needs rerendering");}return u;}};});
