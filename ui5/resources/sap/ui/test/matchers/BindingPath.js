/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['./Matcher'],function(M){"use strict";return M.extend("sap.ui.test.matchers.BindingPath",{metadata:{publicMethods:["isMatching"],properties:{path:{type:"string"},modelName:{type:"string"}}},isMatching:function(c){if(!this.getPath()){this._oLogger.error("The binding path property is required but not defined");return false;}var m=this.getModelName()||undefined;var b=c.getBindingContext(m);if(!b){this._oLogger.debug("The control '"+c+"' has no binding context"+(m?" for the model "+m:""));return false;}var r=this.getPath()===b.getPath();if(!r){this._oLogger.debug("The control '"+c+"' has a binding context"+(m?" for the model "+m:"")+" but its binding path is "+b.getPath()+" when it should be "+this.getPath());}return r;}});});
