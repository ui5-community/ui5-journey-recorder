/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";function p(o,n){if(o.childElementCount!=n.childElementCount||o.tagName!=n.tagName){o.parentNode.replaceChild(n,o);return false;}if(o.isEqualNode(n)){return true;}var O=o.attributes;for(var i=0,a=O.length;i<a;i++){var A=O[i].name;if(n.getAttribute(A)===null){o.removeAttribute(A);a=a-1;i=i-1;}}var N=n.attributes;for(var i=0,a=N.length;i<a;i++){var A=N[i].name,v=o.getAttribute(A),b=n.getAttribute(A);if(v===null||v!==b){o.setAttribute(A,b);}}var c=n.childNodes.length;if(!c&&!o.hasChildNodes()){return true;}if(!n.childElementCount){if(!c){o.textContent="";}else if(c==1&&n.firstChild.nodeType==3){o.textContent=n.textContent;}else{o.innerHTML=n.innerHTML;}return true;}for(var i=0,r=0,a=c;i<a;i++){var d=o.childNodes[i],e=n.childNodes[i-r];if(e.nodeType==1){if(!p(d,e)){r=r+1;}}else{d.nodeValue=e.nodeValue;}}return true;}return p;});
