/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/core/Popup","sap/ui/core/BusyIndicator","sap/base/Log"],function(P,B,L){"use strict";var Z=10;var l;var m;var i;var g=function(){var n;var b=B.oPopup;if(b&&b.isOpen()&&b.getModal()){if(l!==b._iZIndex){l=b._iZIndex;i=l-Z;m=l-3;}if(i<m){n=++i;}else{n=m;L.error('sap.ui.dt.util.getNextZIndex: z-index limit has been exceeded, therefore all following calls receive the same z-Index = '+n);}}else{n=P.getNextZIndex();}return n;};return g;});
