/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/base/Log"],function(L){"use strict";return{display:function(t,d,T){var s=Promise.resolve();return this._display(t,d,T,s);},_display:function(t,d,T,s){var a=this,v=[];if(!Array.isArray(t)){t=[t];}this._attachTitleChanged(t,T);return t.reduce(function(p,b){return a._displaySingleTarget(b,d,p).then(function(V){v.push(V);});},s).then(function(){return v;});},_displaySingleTarget:function(n,d,s){var t=this.getTarget(n);if(t!==undefined){return t._display(d,s);}else{var e="The target with the name \""+n+"\" does not exist!";L.error(e,this);return Promise.resolve({name:n,error:e});}}};});
