/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var U=function(u){this.mParams={};var q=u;if(q){if(q.indexOf('#')>=0){q=q.slice(0,q.indexOf('#'));}if(q.indexOf("?")>=0){q=q.slice(q.indexOf("?")+1);var p=q.split("&"),P={},a,n,v;for(var i=0;i<p.length;i++){a=p[i].split("=");n=decodeURIComponent(a[0]);v=a.length>1?decodeURIComponent(a[1].replace(/\+/g,' ')):"";if(n){if(!Object.prototype.hasOwnProperty.call(P,n)){P[n]=[];}P[n].push(v);}}this.mParams=P;}}};U.prototype={};U.prototype.get=function(n,a){var v=Object.prototype.hasOwnProperty.call(this.mParams,n)?this.mParams[n]:[];return a===true?v:(v[0]||null);};return U;});
