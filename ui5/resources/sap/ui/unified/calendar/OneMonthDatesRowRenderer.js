/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(['sap/ui/core/Renderer','./MonthRenderer','./DatesRowRenderer'],function(R,M,D){"use strict";var O=R.extend(D);["getClass","renderMonth","renderDays","renderHeader"].forEach(function(h){O[h]=function(r,d){if(d.iMode<2){return M[h].apply(M,arguments);}else{return D[h].apply(D,arguments);}};});return O;},true);
