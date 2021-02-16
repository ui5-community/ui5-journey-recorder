/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/thirdparty/jquery","sap/base/assert"],function(q,a){"use strict";var r=function rectContains(p,P){a(!isNaN(p),"iPosX must be a number");a(!isNaN(P),"iPosY must be a number");var R=this.rect();if(R){return p>=R.left&&p<=R.left+R.width&&P>=R.top&&P<=R.top+R.height;}return false;};q.fn.rectContains=r;return q;});
