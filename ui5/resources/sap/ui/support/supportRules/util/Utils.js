/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var U={isDistributionOpenUI5:function(v){var r=false,f="";try{f=v.gav?v.gav:v.name;r=f.indexOf('openui5')!==-1?true:false;}catch(e){return r;}return r;},canLoadInternalRules:function(){var f=jQuery.sap.getModulePath("sap.ui.support").replace("/resources/","/test-resources/")+"/internal/.ping";var c;jQuery.ajax({type:"HEAD",async:false,url:f,success:function(){c=true;},error:function(){c=false;}});return c;},generateUuidV4:function(){var u='xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(p){var r=Math.random()*16|0;if(p==='y'){r=r&0x3|0x8;}return r.toString(16);});return u;}};return U;});
