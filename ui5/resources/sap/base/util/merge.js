/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./isPlainObject"],function(a){"use strict";var m=function(){
/*
		 * The code in this function is taken from jQuery 2.2.3 "jQuery.extend" and got modified.
		 *
		 * jQuery JavaScript Library v2.2.3
		 * http://jquery.com/
		 *
		 * Copyright jQuery Foundation and other contributors
		 * Released under the MIT license
		 * http://jquery.org/license
		 */
var s,c,b,n,o,d,t=arguments[0]||{},i=1,l=arguments.length;if(typeof t!=="object"&&typeof t!=="function"){t={};}for(;i<l;i++){o=arguments[i];for(n in o){s=t[n];b=o[n];if(t===b){continue;}if(b&&(a(b)||(c=Array.isArray(b)))){if(c){c=false;d=Array.isArray(s)?s:[];}else{d=s&&a(s)?s:{};}t[n]=m(d,b);}else{t[n]=b;}}}return t;};return m;});
