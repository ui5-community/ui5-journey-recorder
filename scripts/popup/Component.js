sap.ui.define([
    'sap/ui/core/UIComponent',
], function (UIComponent) {
    'use strict';

    return UIComponent.extend('com.ui5.testing.Component', {
        metadata: {
            manifest: {
                _version: "1.0.0",
                "sap.app": {
                    _version: "1.0.0",
                    id: "com.ui5.testing",
                    type: "application",
                    i18n: "i18n/i18n.properties",
                    title: "{{appTitle}}",
                    description: "{{appDescription}}",
                    applicationVersion: {
                        version: "1.0.0"
                    },
                    dataSources: {
                    }
                },
                "sap.ui": {
                    _version: "1.3.0",
                    technology: "UI5",
                    icons: {
                        icon: "sap-icon://detail-view"
                    },
                    deviceTypes: {
                        desktop: true,
                        tablet: true,
                        phone: true
                    },
                    supportedThemes: [
                        "sap_belize_plus"
                    ],
                    fullWidth: true
                },
                "sap.ui5": {
                    _version: "1.2.0",
                    handleValidation: true,
                    rootView: {
                        viewName: "com.ui5.testing.view.App",
                        type: "XML",
                        id: "app"
                    },
                    dependencies: {
                        minUI5Version: "1.48.0",
                        libs: {
                            "sap.ui.core": {},
                            "sap.m": {},
                            "sap.ui.layout": {}
                        }
                    },
                    contentDensities: {
                        compact: true,
                        cozy: true
                    },
                    models: {
                        i18n: {
                            type: "sap.ui.model.resource.ResourceModel",
                            settings: {
                                bundleName: "com.ui5.testing.i18n.i18n"
                            }
                        }
                    },
                    routing: {
                        config: {
                            routerClass: "sap.m.routing.Router",
                            viewType: "XML",
                            viewPath: "com.ui5.testing.view",
                            controlId: "idAppControl",
                            controlAggregation: "pages",
                            bypassed: {
                                target: [
                                    "ui5Testing"
                                ]
                            },
                            async: true
                        },
                        routes: [
                            {
                                pattern: "/testDetails/{TestId}/elementCreate/{ElementId}",
                                name: "elementCreate",
                                target: "elementCreate"
                            },
                            {
                                pattern: "/testDetails/{TestId}/elementCreateQuick/{ElementId}",
                                name: "elementCreateQuick",
                                target: "elementCreateQuick"
                            },
                            {
                                pattern: "/elementDisplay/{TestId}/{ElementId}",
                                name: "elementDisplay",
                                target: "elementDisplay"
                            },
                            {
                                pattern: "/mockserver",
                                name: "mockserver",
                                target: "mockserver"
                            },
                            {
                                pattern: "/testDetails/{TestId}",
                                name: "testDetails",
                                target: "testDetails"
                            },
                            {
                                pattern: "/testReplay/{TestId}",
                                name: "testReplay",
                                target: "testReplay"
                            },
                            {
                                pattern: "/testDetailsCreate",
                                name: "testDetailsCreate",
                                target: "testDetailsCreate"
                            },
                            {
                                pattern: "/testDetailsCreateQuick",
                                name: "testDetailsCreateQuick",
                                target: "testDetailsCreateQuick"
                            },
                            {
                                pattern: "",
                                name: "start",
                                target: "start"
                            },
                            {
                                pattern: "/settings",
                                name: "settings",
                                target: "settings"
                            },
                            {
                                pattern: "/overview",
                                name: "overview",
                                target: "overview"
                            }
                        ],
                        targets: {
                            elementCreate: {
                                viewName: "ui5Testing",
                                viewLevel: 1,
                                viewId: "ui5Testing",
                                controlAggregation: "pages"
                            },
                            elementCreateQuick: {
                                viewName: "ui5Testing",
                                viewLevel: 1,
                                viewId: "ui5Testing",
                                controlAggregation: "pages"
                            },
                            mockserver: {
                                viewName: "mockserver",
                                viewLevel: 1,
                                viewId: "mockserver",
                                controlAggregation: "pages"
                            },
                            elementDisplay: {
                                viewName: "ui5Testing",
                                viewLevel: 1,
                                viewId: "ui5Testing",
                                controlAggregation: "pages"
                            },
                            testReplay: {
                                viewName: "testDetails",
                                viewLevel: 1,
                                viewId: "testDetails",
                                controlAggregation: "pages"
                            },
                            testDetails: {
                                viewName: "testDetails",
                                viewLevel: 1,
                                viewId: "testDetails",
                                controlAggregation: "pages"
                            },
                            testDetailsCreate: {
                                viewName: "testDetails",
                                viewLevel: 1,
                                viewId: "testDetails",
                                controlAggregation: "pages"
                            },
                            testDetailsCreateQuick: {
                                viewName: "testDetails",
                                viewLevel: 1,
                                viewId: "testDetails",
                                controlAggregation: "pages"
                            },
                            start: {
                                viewName: "start",
                                viewLevel: 1,
                                viewId: "start",
                                controlAggregation: "pages"
                            },
                            overview: {
                                viewName: "testOverview",
                                viewLevel: 1,
                                viewId: "testOverview",
                                controlAggregation: "pages"
                            },
                            settings: {
                                viewName: "settings",
                                viewLevel: 1,
                                viewId: "settings",
                                controlAggregation: "pages"
                            }
                        }
                    },
                    resources: {
                        css: [
                            {
                                uri: "css/style.css"
                            },
                            {
                                uri: "css/additional.css"
                            }
                        ]
                    }
                }
            }
        },

        init: function () {
            UIComponent.prototype.init.apply(this, arguments);
            this.getRouter().initialize();
        },

        destroy: function () {
            UIComponent.prototype.destroy.apply(this, arguments);
        },

        getContentDensityClass: function () {
            return 'sapUiSizeCompact';
        }

    });
});