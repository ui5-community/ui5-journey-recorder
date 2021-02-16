/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log"],function(L){"use strict";var X="XHRInterceptor";var r=Object.create(null);var o=Object.create(null);var x=Object.create(null);function c(b,C){o[b]=[];x[b]=window.XMLHttpRequest.prototype[b];window.XMLHttpRequest.prototype[b]=function(){var A=arguments;x[b].apply(this,A);o[b].forEach(function(C){C.apply(this,A);}.bind(this));};}function s(n,b,C){r[n]=r[n]||{};var O=r[n][b];if(O){var i=o[b].indexOf(O);o[b][i]=C;}else{r[n][b]=C;o[b].push(C);}}var a={register:function(n,b,C){L.debug("Register '"+n+"' for XHR function '"+b+"'",X);if(!o[b]){c(b,C);}s(n,b,C);},unregister:function(n,b){var R=this.isRegistered(n,b);if(R){o[b]=o[b].filter(function(C){return C!==r[n][b];});delete r[n][b];if(Object.keys(r[n]).length===0){delete r[n];}}L.debug("Unregister '"+n+"' for XHR function '"+b+(R?"'":"' failed"),X);return R;},isRegistered:function(n,b){return r[n]&&r[n][b];}};return a;});
