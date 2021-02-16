/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['sap/ui/core/Renderer','./BaseRenderer'],function(R,B){"use strict";var A=R.extend('sap.ui.rta.toolbar.AdaptationRenderer',B);A.render=function(r,c){r.addClass('sapUiRtaToolbarAdaptation');B.render(r,c);};return A;});
