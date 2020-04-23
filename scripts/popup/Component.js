sap.ui.define([
    'sap/ui/core/UIComponent'
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
                                    "TestStep"
                                ]
                            },
                            async: true
                        },
                        routes: [
                            {
                                pattern: "/TestDetails/{TestId}/elementCreate/{ElementId}",
                                name: "elementCreate",
                                target: "testElement"
                            },
                            {
                                pattern: "/TestDetails/{TestId}/elementCreateQuick/{ElementId}",
                                name: "elementCreateQuick",
                                target: "testElement"
                            },
                            {
                                pattern: "/elementDisplay/{TestId}/{ElementId}",
                                name: "elementDisplay",
                                target: "testElement"
                            },
                            {
                                pattern: "/mockserver",
                                name: "mockserver",
                                target: "mockserver"
                            },
                            {
                                pattern: "/TestDetails/{TestId}",
                                name: "TestDetails",
                                target: "TestDetails"
                            },
                            {
                                pattern: "/TestDetailsCreate",
                                name: "TestDetailsCreate",
                                target: "TestDetails"
                            },
                            {
                                pattern: "/TestDetailsCreateQuick",
                                name: "TestDetailsCreateQuick",
                                target: "TestDetails"
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
                            }
                        ],
                        targets: {
                            mockserver: {
                                viewName: "Mockserver",
                                viewLevel: 1,
                                viewId: "mockserver",
                                controlAggregation: "pages"
                            },
                            testElement: {
                                viewName: "TestStep",
                                viewLevel: 1,
                                viewId: "TestStep",
                                controlAggregation: "pages"
                            },
                            TestDetails: {
                                viewName: "TestDetails",
                                viewLevel: 1,
                                viewId: "TestDetails",
                                controlAggregation: "pages"
                            },
                            start: {
                                viewName: "Start",
                                viewLevel: 1,
                                viewId: "start",
                                controlAggregation: "pages"
                            },
                            settings: {
                                viewName: "Settings",
                                viewLevel: 1,
                                viewId: "settings",
                                controlAggregation: "pages"
                            }
                        }
                    },
                    resources: {
                        css: [{
                            uri: "css/additional.css"
                        }]
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
