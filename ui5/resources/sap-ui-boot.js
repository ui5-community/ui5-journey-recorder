/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
(function(){"use strict";var s,m,b;s=document.getElementById("sap-ui-bootstrap");if(s){m=/^(?:.*\/)?resources\//.exec(s.getAttribute("src"));if(m){b=m[0];}}if(b==null){throw new Error("sap-ui-boot.js: could not identify script tag!");}function l(u,c){var p=u.length,a=0;function d(e){p--;if(e.type==='error'){a++;}e.target.removeEventListener("load",d);e.target.removeEventListener("error",d);if(p===0&&a===0&&c){c();}}for(var i=0;i<u.length;i++){var f=document.createElement("script");f.addEventListener("load",d);f.addEventListener("error",d);f.src=b+u[i];document.head.appendChild(f);}}l(["sap/ui/thirdparty/baseuri.js","sap/ui/thirdparty/es6-promise.js","sap/ui/thirdparty/es6-string-methods.js","sap/ui/thirdparty/es6-object-assign.js"],function(){l(["ui5loader.js"],function(){sap.ui.loader.config({async:true});l(["ui5loader-autoconfig.js"]);});});}());
