/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([],function(){"use strict";var C={};C.render=function(r,c){r.write("<div");r.writeControlData(c);if(c.bResponsive){r.addClass("sapUiColorPicker-"+c.getDisplayMode());}r.writeClasses();r.write(">");r.renderControl(c.getAggregation("_grid"));r.write("</div>");};return C;},true);
