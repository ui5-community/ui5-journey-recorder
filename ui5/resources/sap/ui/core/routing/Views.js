/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["./TargetCache","sap/base/util/UriParameters","sap/base/Log"],function(T,U,L){"use strict";var V=T.extend("sap.ui.core.routing.Views",{metadata:{publicMethods:["getView","setView"]},constructor:function(o){if(!o){o={};}function c(){if(new U(window.location.href).get("sap-ui-xx-asyncRouting")==="true"){L.warning("Activation of async view loading in routing via url parameter is only temporarily supported and may be removed soon","TargetCache");return true;}return false;}if(o.async===undefined){o.async=c();}T.apply(this,[o]);},getView:function(o){return this.get(o,"View");},setView:function(n,v){return this.set(n,"View",v);},fireCreated:function(a){if(a){a.view=a.object;a.viewOptions=a.options;}return this.fireEvent("created",a);}});return V;});
