/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['sap/ui/core/Renderer','sap/m/HBoxRenderer'],function(R,H){"use strict";var B=R.extend('sap.ui.rta.toolbar.BaseRenderer',H);B.render=function(r,c){r.addClass('sapUiRtaToolbar');r.addClass('sapContrastPlus');r.addClass("color_"+c.getColor());c.type&&r.addClass("type_"+c.type);var z=c.getZIndex();z&&r.addStyle("z-index",z);H.render(r,c);};return B;});
