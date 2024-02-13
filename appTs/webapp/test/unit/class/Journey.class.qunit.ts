import Journey from "com/ui5/journeyrecorder/model/class/Journey.class";
import { Step } from "com/ui5/journeyrecorder/model/class/Step.class";

const oldStorageData = JSON.stringify({
    "created": 1678290702297,
    "edited": 1707083325240,
    "pages": [
        {
            "page_id": "0",
            "page_location": "http://localhost:8080/index.html#/other",
            "page_steps": [
                {
                    "step_id": "7ee67bc0-ada4-4bca-8d3d-9ed1a091008c",
                    "action_type": "clicked",
                    "style_classes": [
                        "injectClass"
                    ],
                    "action_location": "http://localhost:8080/index.html#/other",
                    "record_replay_selector": {
                        "id": "test.Sample.tsapp::TargetOther--myTable-content::C::City"
                    },
                    "control": {
                        "control_id": {
                            "id": "test.Sample.tsapp::TargetOther--myTable-content::C::City",
                            "use": true
                        },
                        "control_type": "sap.ui.mdc.table.Column",
                        "properties": [
                            {
                                "name": "width",
                                "value": "9.3425rem",
                                "use": false
                            },
                            {
                                "name": "minWidth",
                                "value": 8,
                                "use": false
                            },
                            {
                                "name": "header",
                                "value": "City",
                                "use": false
                            },
                            {
                                "name": "headerVisible",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "hAlign",
                                "value": "Begin",
                                "use": false
                            },
                            {
                                "name": "importance",
                                "value": "High",
                                "use": false
                            },
                            {
                                "name": "initialIndex",
                                "value": -1,
                                "use": false
                            },
                            {
                                "name": "dataProperty",
                                "value": "City",
                                "use": false
                            },
                            {
                                "name": "required",
                                "value": false,
                                "use": false
                            },
                            {
                                "name": "creationTemplate",
                                "value": null,
                                "use": false
                            },
                            {
                                "name": "extendedSettings",
                                "value": null,
                                "use": false
                            }
                        ],
                        "bindings": [
                            {
                                "propertyName": "width",
                                "use": false
                            },
                            {
                                "propertyName": "width",
                                "bindingValue": "Display",
                                "modelPath": "/pages/test.Sample.tsapp::TargetOther",
                                "propertyPath": "/editMode",
                                "modelName": "ui",
                                "use": false
                            },
                            {
                                "propertyName": "width",
                                "bindingValue": true,
                                "modelPath": "/pages/test.Sample.tsapp::TargetOther/controls/myTable-content",
                                "propertyPath": "tablePropertiesAvailable",
                                "modelName": "internal",
                                "use": false
                            },
                            {
                                "propertyName": "width",
                                "use": false
                            },
                            {
                                "propertyName": "width",
                                "use": false
                            }
                        ]
                    }
                },
                {
                    "step_id": "3b9bbe27-d8f6-48e1-aa73-ea7684da65a3",
                    "action_type": "clicked",
                    "style_classes": [
                        "injectClass"
                    ],
                    "action_location": "http://localhost:8080/index.html#/other",
                    "record_replay_selector": {
                        "controlType": "sap.m.StandardListItem",
                        "properties": {
                            "title": "Filter"
                        },
                        "searchOpenDialogs": true
                    },
                    "control": {
                        "control_id": {
                            "id": "__item136",
                            "use": false
                        },
                        "control_type": "sap.m.StandardListItem",
                        "properties": [
                            {
                                "name": "title",
                                "value": "Filter",
                                "use": true
                            },
                            {
                                "name": "description",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "icon",
                                "value": "sap-icon://filter",
                                "use": false
                            },
                            {
                                "name": "iconInset",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "iconDensityAware",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "activeIcon",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "info",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "infoState",
                                "value": "None",
                                "use": false
                            },
                            {
                                "name": "adaptTitleSize",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "titleTextDirection",
                                "value": "Inherit",
                                "use": false
                            },
                            {
                                "name": "infoTextDirection",
                                "value": "Inherit",
                                "use": false
                            },
                            {
                                "name": "wrapping",
                                "value": false,
                                "use": false
                            },
                            {
                                "name": "infoStateInverted",
                                "value": false,
                                "use": false
                            },
                            {
                                "name": "wrapCharLimit",
                                "value": 0,
                                "use": false
                            },
                            {
                                "name": "avatar",
                                "value": null,
                                "use": false
                            }
                        ]
                    }
                },
                {
                    "step_id": "6dbc06b2-ea19-41ce-b8e2-ac669bf6b145",
                    "action_type": "clicked",
                    "style_classes": [
                        "sapMInputBaseIcon",
                        "injectClass"
                    ],
                    "action_location": "http://localhost:8080/index.html#/other",
                    "record_replay_selector": {
                        "id": "test.Sample.tsapp::TargetOther--myTable-content::AdaptationFilterField::City-inner-vhi",
                        "searchOpenDialogs": true
                    },
                    "control": {
                        "control_id": {
                            "id": "test.Sample.tsapp::TargetOther--myTable-content::AdaptationFilterField::City-inner-vhi",
                            "use": true
                        },
                        "control_type": "sap.ui.core.Icon",
                        "properties": [
                            {
                                "name": "src",
                                "value": "sap-icon://value-help",
                                "use": false
                            },
                            {
                                "name": "size",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "color",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "hoverColor",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "activeColor",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "width",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "height",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "backgroundColor",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "hoverBackgroundColor",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "activeBackgroundColor",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "decorative",
                                "value": false,
                                "use": false
                            },
                            {
                                "name": "useIconTooltip",
                                "value": false,
                                "use": false
                            },
                            {
                                "name": "alt",
                                "value": "Show Value Help",
                                "use": false
                            },
                            {
                                "name": "noTabStop",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "ariaLabelledBy",
                                "value": [],
                                "use": false
                            }
                        ]
                    }
                },
                {
                    "step_id": "326b4503-2729-42dc-9d46-6a42f8404c05",
                    "action_type": "clicked",
                    "style_classes": [
                        "injectClass"
                    ],
                    "action_location": "http://localhost:8080/index.html#/other",
                    "record_replay_selector": {
                        "controlType": "sap.fe.core.controls.FieldWrapper",
                        "viewName": "test.Sample.tsapp.view.Other",
                        "viewId": "test.Sample.tsapp::TargetOther",
                        "searchOpenDialogs": true,
                        "ancestor": {
                            "id": "test.Sample.tsapp::TargetOther--myTable-content::AdaptationFilterFieldValueHelp::City::Dialog::qualifier::::Table-innerTable-rows-row1",
                            "searchOpenDialogs": true
                        }
                    },
                    "control": {
                        "control_id": {
                            "id": "__wrapper6-__clone18-__clone20",
                            "use": false
                        },
                        "control_type": "sap.fe.core.controls.FieldWrapper",
                        "properties": [
                            {
                                "name": "accessibilityInfo",
                                "value": {
                                    "description": "London"
                                },
                                "use": false
                            },
                            {
                                "name": "idForLabel",
                                "value": "__text56-__clone18-__clone20",
                                "use": false
                            },
                            {
                                "name": "width",
                                "value": "100%",
                                "use": false
                            },
                            {
                                "name": "formDoNotAdjustWidth",
                                "value": false,
                                "use": false
                            },
                            {
                                "name": "editMode",
                                "value": "Display",
                                "use": false
                            },
                            {
                                "name": "required",
                                "value": false,
                                "use": false
                            },
                            {
                                "name": "contentEdit",
                                "value": [],
                                "use": false
                            },
                            {
                                "name": "ariaLabelledBy",
                                "value": [],
                                "use": false
                            }
                        ]
                    }
                },
                {
                    "step_id": "1aad27d1-a4bd-414d-a355-1637c2c8fc7a",
                    "action_type": "clicked",
                    "style_classes": [
                        "sapMBarChild",
                        "injectClass"
                    ],
                    "action_location": "http://localhost:8080/index.html#/other",
                    "record_replay_selector": {
                        "controlType": "sap.m.Button",
                        "viewName": "test.Sample.tsapp.view.Other",
                        "viewId": "test.Sample.tsapp::TargetOther",
                        "bindingPath": {
                            "path": "",
                            "propertyPath": "/_valid",
                            "modelName": "$valueHelp"
                        },
                        "searchOpenDialogs": true
                    },
                    "control": {
                        "control_id": {
                            "id": "__dialog1-ok",
                            "use": false
                        },
                        "control_type": "sap.m.Button",
                        "properties": [
                            {
                                "name": "activeIcon",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "ariaDescribedBy",
                                "value": [],
                                "use": false
                            },
                            {
                                "name": "ariaHasPopup",
                                "value": "None",
                                "use": false
                            },
                            {
                                "name": "ariaLabelledBy",
                                "value": [],
                                "use": false
                            },
                            {
                                "name": "enabled",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "icon",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "iconDensityAware",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "iconFirst",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "text",
                                "value": "OK",
                                "use": false
                            },
                            {
                                "name": "textDirection",
                                "value": "Inherit",
                                "use": false
                            },
                            {
                                "name": "type",
                                "value": "Emphasized",
                                "use": false
                            },
                            {
                                "name": "width",
                                "value": "",
                                "use": false
                            }
                        ],
                        "bindings": [
                            {
                                "propertyName": "visible",
                                "bindingValue": -1,
                                "propertyPath": "/_config/maxConditions",
                                "modelName": "$valueHelp",
                                "use": false
                            },
                            {
                                "propertyName": "visible",
                                "bindingValue": false,
                                "propertyPath": "/_quickSelectEnabled",
                                "modelName": "$help",
                                "use": false
                            },
                            {
                                "propertyName": "enabled",
                                "bindingValue": true,
                                "propertyPath": "/_valid",
                                "modelName": "$valueHelp",
                                "use": true
                            }
                        ]
                    }
                },
                {
                    "step_id": "085e77d1-fc58-4eed-b628-232fc594f919",
                    "action_type": "clicked",
                    "style_classes": [
                        "sapMBarChild",
                        "injectClass"
                    ],
                    "action_location": "http://localhost:8080/index.html#/other",
                    "record_replay_selector": {
                        "controlType": "sap.m.Button",
                        "properties": {
                            "text": "OK"
                        },
                        "searchOpenDialogs": true
                    },
                    "control": {
                        "control_id": {
                            "id": "__button16",
                            "use": false
                        },
                        "control_type": "sap.m.Button",
                        "properties": [
                            {
                                "name": "activeIcon",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "ariaDescribedBy",
                                "value": [],
                                "use": false
                            },
                            {
                                "name": "ariaHasPopup",
                                "value": "None",
                                "use": false
                            },
                            {
                                "name": "ariaLabelledBy",
                                "value": [],
                                "use": false
                            },
                            {
                                "name": "enabled",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "icon",
                                "value": "",
                                "use": false
                            },
                            {
                                "name": "iconDensityAware",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "iconFirst",
                                "value": true,
                                "use": false
                            },
                            {
                                "name": "text",
                                "value": "OK",
                                "use": true
                            },
                            {
                                "name": "textDirection",
                                "value": "Inherit",
                                "use": false
                            },
                            {
                                "name": "type",
                                "value": "Emphasized",
                                "use": false
                            },
                            {
                                "name": "width",
                                "value": "",
                                "use": false
                            }
                        ]
                    }
                },
                {
                    "step_id": "c351e0a8-c18e-4ffe-bc8d-20b29b208d4f",
                    "action_type": "validate",
                    "style_classes": [
                        "sapMOTB",
                        "sapMListInfoTBar",
                        "injectClass"
                    ],
                    "action_location": "http://localhost:8080/index.html#/other",
                    "record_replay_selector": {
                        "id": "test.Sample.tsapp::TargetOther--myTable-content-filterInfoBar"
                    },
                    "control": {
                        "control_id": {
                            "id": "test.Sample.tsapp::TargetOther--myTable-content-filterInfoBar",
                            "use": true
                        },
                        "control_type": "sap.m.OverflowToolbar",
                        "properties": [
                            {
                                "name": "asyncMode",
                                "value": false,
                                "use": false
                            }
                        ]
                    }
                }
            ],
            "view_information": {
                "absoluteViewName": "test.Sample.tsapp.view.Other",
                "relativeViewName": "Other"
            }
        }
    ],
    "scenario_id": "1",
    "scenario_name": "Test Scenario",
    "ui5_version": "1.110.0"
});

QUnit.module("Journey class tests");

QUnit.test("The Journey class also accepts the old storage format", function (assert) {
    // as a very basic test example just check the presence of the "sayHello" method
    const j: Journey = Journey.fromJSON(oldStorageData);
    assert.ok(j);
    assert.equal(j.created, 1678290702297);
    assert.equal(j.edited, 1707083325240);
    assert.equal(j.id, "1");
    assert.equal(j.name, "Test Scenario");
    assert.equal(j.ui5Version, "1.110.0");
    assert.equal(j.startUrl, "http://localhost:8080/index.html#/other");
    assert.equal(j.steps.length, 7);
});

QUnit.test("The Step class is also correct created by the old format", function (assert) {
    const j: Journey = Journey.fromJSON(oldStorageData);
    const step0: Step = j.steps[0];
    assert.equal(step0.id, "7ee67bc0-ada4-4bca-8d3d-9ed1a091008c");
    assert.equal(step0.actionType, "clicked");
    assert.equal(step0.actionLocation, "http://localhost:8080/index.html#/other");
    assert.deepEqual(step0.styleClasses, ["injectClass"]);
    assert.deepEqual(step0.viewInfos, {
        "absoluteViewName": "test.Sample.tsapp.view.Other",
        "relativeViewName": "Other"
    });
    assert.deepEqual(step0.recordReplaySelector, {
        "id": "test.Sample.tsapp::TargetOther--myTable-content::C::City"
    });
    assert.deepEqual(step0.control, {
        "controlId": {
            "id": "test.Sample.tsapp::TargetOther--myTable-content::C::City",
            "use": true
        },
        "type": "sap.ui.mdc.table.Column",
        "properties": [
            {
                "name": "width",
                "value": "9.3425rem",
                "use": false
            },
            {
                "name": "minWidth",
                "value": 8,
                "use": false
            },
            {
                "name": "header",
                "value": "City",
                "use": false
            },
            {
                "name": "headerVisible",
                "value": true,
                "use": false
            },
            {
                "name": "hAlign",
                "value": "Begin",
                "use": false
            },
            {
                "name": "importance",
                "value": "High",
                "use": false
            },
            {
                "name": "initialIndex",
                "value": -1,
                "use": false
            },
            {
                "name": "dataProperty",
                "value": "City",
                "use": false
            },
            {
                "name": "required",
                "value": false,
                "use": false
            },
            {
                "name": "creationTemplate",
                "value": null,
                "use": false
            },
            {
                "name": "extendedSettings",
                "value": null,
                "use": false
            }
        ],
        "bindings": [
            {
                "propertyName": "width",
                "use": false
            },
            {
                "propertyName": "width",
                "bindingValue": "Display",
                "modelPath": "/pages/test.Sample.tsapp::TargetOther",
                "propertyPath": "/editMode",
                "modelName": "ui",
                "use": false
            },
            {
                "propertyName": "width",
                "bindingValue": true,
                "modelPath": "/pages/test.Sample.tsapp::TargetOther/controls/myTable-content",
                "propertyPath": "tablePropertiesAvailable",
                "modelName": "internal",
                "use": false
            },
            {
                "propertyName": "width",
                "use": false
            },
            {
                "propertyName": "width",
                "use": false
            }
        ],
        "i18nTexts": undefined
    });
});